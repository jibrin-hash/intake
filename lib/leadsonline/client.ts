import { Tables } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client"; // Will use server-side client normally, need to inject it or pass it.

export type LeadsOnlineConfig = {
  storeId: string;
  username: string;
  password: string;
  url: string;
};

export class LeadsOnlineClient {
  private config: LeadsOnlineConfig;

  constructor(config: LeadsOnlineConfig) {
    this.config = config;
  }

  private getSoapEnvelope(bodyContent: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    ${bodyContent}
  </soap:Body>
</soap:Envelope>`;
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatDateTime(date: string | Date): string {
    // 2018-02-13T15:25:00
    const d = new Date(date);
    return d.toISOString().split('.')[0];
  }

  // Helper to fetch image from Supabase Storage and convert to Base64
  private async getImageBase64(storagePath: string): Promise<string> {
    let url = storagePath;
    if (!url.startsWith('http')) {
      // Construct public URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      url = `${supabaseUrl}/storage/v1/object/public/intake-photos/${storagePath}`;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) return "";
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    } catch (e) {
      console.error("Error fetching image for LeadsOnline:", e);
      return "";
    }
  }

  async submitTransaction(
    intake: Tables<"intakes">,
    items: (Tables<"items"> & { images: Tables<"item_images">[] })[],
    customer: Tables<"customers">,
    // Optional: Map of image ID to Base64 string if pre-fetched
    imageBase64Map?: Record<string, string>
  ) {
    // Validate required fields
    if (!customer.address_line_1 || !customer.city || !customer.state || !customer.postal_code) {
      throw new Error("Missing customer address information");
    }
    if (!customer.dob || !customer.id_number || !customer.id_type) {
      throw new Error("Missing customer ID or DOB");
    }

    // Prepare Images XML parts
    const itemsXmlPromise = items.map(async (item) => {
      const imagesXmlPromise = item.images.map(async (img) => {
        let base64 = "";
        if (imageBase64Map && imageBase64Map[img.id]) {
          base64 = imageBase64Map[img.id];
        } else {
          base64 = await this.getImageBase64(img.storage_path);
        }

        if (!base64) return "";

        return `
              <Image ImageCategory="Item" ImageType="Jpeg">
                 <imageData>${base64}</imageData> 
              </Image>`;
      });

      const imagesXml = (await Promise.all(imagesXmlPromise)).join('');

      return `
          <Item>
            <make>${item.brand || "Unknown"}</make>
            <model>${item.model || "Unknown"}</model>
            <description>${item.description || item.category || "Item"}</description>
            <amount>${item.purchase_price || 0}</amount>
            <itemType>Other</itemType>
            <itemStatus>Buy</itemStatus>
            <isVoid>false</isVoid>
            <employee>Employee</employee>
            ${item.serial_number ? `
            <extraItem>
              <PropertyValue>
                <Name>SERIAL_NUMBER</Name>
                <Value>${item.serial_number}</Value>
              </PropertyValue>
            </extraItem>` : ''}
            <images>${imagesXml}</images>
          </Item>`;
    });

    const itemsXml = (await Promise.all(itemsXmlPromise)).join('');

    const ticketContent = `
    <SubmitTransaction xmlns="http://www.leadsonline.com/">
      <login>
        <storeId>${this.config.storeId}</storeId>
        <userName>${this.config.username}</userName>
        <password>${this.config.password}</password>
      </login>
      <ticket>
        <key>
          <ticketType>Buy</ticketType>
          <ticketnumber>${Math.floor(Math.random() * 100000)}</ticketnumber>
          <ticketDateTime>${this.formatDateTime(new Date())}</ticketDateTime>
        </key>
        <redeemByDate></redeemByDate>
        <customer>
          <name>${customer.first_name} ${customer.last_name}</name>
          <address1>${customer.address_line_1}</address1>
          <city>${customer.city}</city>
          <state>${customer.state}</state>
          <postalCode>${customer.postal_code}</postalCode>
          <phone>${customer.phone || ""}</phone>
          <idType>${customer.id_type === 'driver_license' ? 'DL' : 'OT'}</idType>
          <idNumber>${customer.id_number}</idNumber>
          <dob>${this.formatDate(customer.dob)}</dob>
          ${customer.weight ? `<weight>${customer.weight}</weight>` : ''}
          ${customer.height ? `<height>${customer.height}</height>` : ''}
          ${customer.eye_color ? `<eyeColor>${customer.eye_color}</eyeColor>` : ''}
          ${customer.hair_color ? `<hairColor>${customer.hair_color}</hairColor>` : ''}
          ${customer.race ? `<race>${customer.race}</race>` : ''}
          ${customer.gender ? `<sex>${customer.gender}</sex>` : ''}
        </customer>
        <items>${itemsXml}</items>
        <isVoid>false</isVoid>
      </ticket>
    </SubmitTransaction>`;

    const xml = this.getSoapEnvelope(ticketContent);

    console.log("LeadsOnline Payload:", xml); // Debugging

    const response = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.leadsonline.com/SubmitTransaction'
      },
      body: xml
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`LeadsOnline API Error: ${response.status} ${response.statusText}\n${responseText}`);
    }

    // Basic check for error in XML response (simplified)
    if (responseText.includes('<errorCode>0</errorCode>')) {
      return { success: true, raw: responseText };
    } else {
      // Extract error code if possible, or just dump response
      throw new Error(`LeadsOnline Business Error: ${responseText}`);
    }
  }
}
