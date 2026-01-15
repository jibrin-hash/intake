"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    label: string
    value: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value?: string
    onChange: (value: string) => void
    onCreate?: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
}

export function Combobox({
    options,
    value,
    onChange,
    onCreate,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    emptyText = "No results found.",
    disabled = false
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const selectedOption = options.find((option) => option.value === value)

    // If value is not in options (custom value)
    const displayValue = selectedOption ? selectedOption.label : (value || placeholder)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                    disabled={disabled}
                >
                    <span className={cn(!value && "text-muted-foreground", "truncate")}>
                        {displayValue}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-muted-foreground">{emptyText}</span>
                                {onCreate && inputValue && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            onCreate(inputValue)
                                            setOpen(false)
                                            setInputValue("")
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create "{inputValue}"
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Search by label
                                    onSelect={(currentValue) => {
                                        // onChange(currentValue === value ? "" : option.value) // Toggle? No, usually selection means select.
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
