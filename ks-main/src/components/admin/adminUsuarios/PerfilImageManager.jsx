import React, { useState, useEffect, useRef, useCallback } from "react";
import { getAllPerfilImages, createPerfilImage, updatePerfilImage, deletePerfilImage } from "../../../services/perfilImagesService";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical } from "lucide-react";
import { toast } from "react-toastify";
import { PerfilImageModal } from "./PerfilImageModal"; // You'll need to create this

export function PerfilImageManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [perfilImages, setPerfilImages] = useState([]);
  const [visibleImages, setVisibleImages] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");

  const tableRef = useRef();
  const observer = useRef();

  useEffect(() => {
    fetchPerfilImages();
  }, []);

  const fetchPerfilImages = async () => {
    try {
      const data = await getAllPerfilImages();
      setPerfilImages(data.data);
      // // console.log(data.data)
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las imágenes de perfil");
    }
  };

  const filteredImages = perfilImages.filter((image) =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadMoreImages = useCallback(() => {
    setVisibleImages((prevVisible) => prevVisible + 10);
  }, []);

  const lastImageRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreImages();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadMoreImages]
  );

  const handleCreateImage = async (imageData) => {
    try {
        // // console.log(imageData)
      await createPerfilImage(imageData);
      toast.success("Imagen de perfil creada exitosamente");
      await fetchPerfilImages();
      setModalOpen(false);
    } catch (error) {
      console.error("Error creando imagen de perfil:", error);
      toast.error("Error al crear la imagen de perfil");
    }
  };

  const handleEditImage = async (imageData) => {
    try {
      const formData = new FormData();
      formData.append('name', imageData.name);
      if (imageData.file) {
        formData.append('image', imageData.file);
      }

      await updatePerfilImage(selectedImage._id, formData);
      toast.success("Imagen de perfil actualizada exitosamente");
      await fetchPerfilImages();
      setModalOpen(false);
      setSelectedImage(null);
    } catch (error) {
      console.error("Error editando imagen de perfil:", error);
      toast.error("Error al actualizar la imagen de perfil");
    }
  };

  const handleDeleteImage = async (image) => {
    if (window.confirm(`¿Estás seguro que deseas eliminar la imagen "${image.name}"?`)) {
      try {
        await deletePerfilImage(image._id);
        toast.success("Imagen de perfil eliminada exitosamente");
        await fetchPerfilImages();
      } catch (error) {
        console.error("Error eliminando imagen de perfil:", error);
        toast.error("Error al eliminar la imagen de perfil");
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar imágenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setModalMode("create");
            setSelectedImage(null);
            setModalOpen(true);
          }}
        >
          Crear Imagen de Perfil
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-y-auto max-h-[calc(100vh-340px)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vista previa</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImages.slice(0, visibleImages).map((image, index) => (
                  <TableRow
                    key={image._id}
                    ref={index === filteredImages.slice(0, visibleImages).length - 1 ? lastImageRef : null}
                  >
                    <TableCell>
                      <img 
                        src={image.src} 
                        alt={image.name} 
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </TableCell>
                    <TableCell>{image.name}</TableCell>
                    <TableCell>{image.src}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='bg-black' align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedImage(image);
                              setModalMode("edit");
                              setModalOpen(true);
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteImage(image)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PerfilImageModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedImage(null);
        }}
        image={selectedImage}
        onSubmit={modalMode === "create" ? handleCreateImage : handleEditImage}
        mode={modalMode}
      />

      {loading && <p className="text-center text-muted-foreground">Cargando más imágenes...</p>}
    </div>
  );
}