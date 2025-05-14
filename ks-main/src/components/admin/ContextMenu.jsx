import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";

export function ContextMenu({ onEdit, onDelete, onActive, onClose }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete}>
                    Eliminar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onActive}>
                    Activar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}