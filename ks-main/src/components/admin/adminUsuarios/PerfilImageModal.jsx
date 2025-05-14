import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const PerfilImageModal = ({ isOpen, onClose, image, onSubmit, mode }) => {
    const [formData, setFormData] = useState({
        name: '',
        file: null,
    });

    useEffect(() => {
        if (mode === 'edit' && image) {
            setFormData({
                name: image.name || '',
                file: null,
            });
        } else if (mode === 'create') {
            setFormData({
                name: '',
                file: null,
            });
        }
    }, [isOpen, mode, image]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.file && mode === 'create') {
            alert("Por favor, selecciona un archivo.");
            return;
        }

        const data = new FormData();
        data.append("name", formData.name);
        if (formData.file) {
            data.append("image", formData.file);
        }

        // console.log("FormData en envío:");
        // data.forEach((value, key) => console.log(`${key}:`, value));

        onSubmit(data);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const fileURL = URL.createObjectURL(file);
          setFormData({ ...formData, file, fileURL });
        }
      };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Crear Imagen de Perfil' : 'Editar Imagen de Perfil'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Archivo de Imagen</Label>
                        <Input
                            id="file"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            required={mode === 'create'}
                        />
                    </div>
                    {formData.fileURL && <img src={formData.fileURL} alt="Preview" className="w-20 h-20 object-cover" />}
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {mode === 'create' ? 'Crear' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
