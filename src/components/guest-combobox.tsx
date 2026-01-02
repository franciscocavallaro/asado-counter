"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Guest } from "@/lib/types";

interface GuestComboboxProps {
  guests: Guest[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function GuestCombobox({
  guests,
  value,
  onChange,
  placeholder = "Elegir invitado...",
}: GuestComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Scroll into view when popover opens (for mobile keyboard)
  React.useEffect(() => {
    if (open && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [open]);

  const filteredGuests = guests.filter((guest) =>
    guest.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showAddNew =
    inputValue.trim() !== "" &&
    !guests.some(
      (guest) => guest.name.toLowerCase() === inputValue.trim().toLowerCase()
    );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleAddNew = () => {
    onChange(inputValue.trim());
    setOpen(false);
    setInputValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-sm sm:text-base truncate"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-3rem)] sm:w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o agregar invitado..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() === "" ? (
                "Escribí para buscar o agregar un invitado"
              ) : (
                <button
                  onClick={handleAddNew}
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Agregar &quot;{inputValue.trim()}&quot;
                </button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredGuests.map((guest) => (
                <CommandItem
                  key={guest.id}
                  value={guest.name}
                  onSelect={() => handleSelect(guest.name)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === guest.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {guest.name}
                </CommandItem>
              ))}
              {showAddNew && filteredGuests.length > 0 && (
                <CommandItem onSelect={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar &quot;{inputValue.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

