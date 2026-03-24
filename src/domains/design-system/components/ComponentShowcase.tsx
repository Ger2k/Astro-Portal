import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  ToastViewport,
  useToast,
} from "@shared/ui/primitives";

export default function ComponentShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toasts, push, dismiss } = useToast();

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Botones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formulario base</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Titulo del juego</span>
              <Input placeholder="Ej: Hollow Knight" aria-label="Titulo del juego" />
            </label>

            <label className="mt-2 block space-y-1">
              <span className="text-sm font-medium">Plataforma</span>
              <Select aria-label="Plataforma">
                <option>PC</option>
                <option>PlayStation 5</option>
                <option>Nintendo Switch</option>
              </Select>
            </label>

            <label className="mt-2 block space-y-1">
              <span className="text-sm font-medium">URL de portada (invalida)</span>
              <Input tone="danger" value="ht!tp://bad-url" aria-invalid="true" readOnly />
            </label>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Modal y Toast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setIsModalOpen(true)}>Abrir modal</Button>
              <Button
                variant="secondary"
                onClick={() =>
                  push({
                    variant: "success",
                    title: "Juego guardado",
                    description: "Los cambios se aplicaron correctamente.",
                  })
                }
              >
                Lanzar toast success
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  push({
                    variant: "error",
                    title: "Error de validacion",
                    description: "Revisa la puntuacion y la fecha de finalizacion.",
                  })
                }
              >
                Lanzar toast error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmar accion"
        description="Este modal usa estructura accesible con cierre por Escape y click en backdrop."
      >
        <p className="text-sm text-muted-foreground">
          En Bloques 2 y 3 reutilizaremos este componente para flujos de auth y eliminacion de juegos.
        </p>
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
