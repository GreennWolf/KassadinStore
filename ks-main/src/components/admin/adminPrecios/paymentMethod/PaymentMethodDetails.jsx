import React from 'react';

export const PaymentMethodDetails = ({
    details,
    onDetailChange,
    onRemoveDetail,
    onAddDetail,
    isEditing
}) => (
    <div>
        <h3 className="text-lg font-semibold text-GOLD_2 m-2">Detalles del Método de Pago</h3>
        {details.map((detail, index) => (
            <div key={index} className="flex flex-col mb-4">
                <input
                    type="text"
                    placeholder="Título"
                    value={detail.title}
                    onChange={(e) => onDetailChange(index, 'title', e.target.value, isEditing)}
                    className="border p-2 m-2 bg-black text-white"
                    required
                />
                <input
                    type="text"
                    placeholder="Descripción"
                    value={detail.description}
                    onChange={(e) => onDetailChange(index, 'description', e.target.value, isEditing)}
                    className="border p-2 mt-4 bg-black text-white"
                    required
                />
                <button
                    type="button"
                    onClick={() => onRemoveDetail(index, isEditing)}
                    className="bg-red-500 text-white px-2 py-1 rounded mt-4 w-32"
                >
                    Eliminar Detalle
                </button>
            </div>
        ))}
        <button
            type="button"
            onClick={() => onAddDetail(isEditing)}
            className="bg-blue-500 text-white px-4 py-2 rounded m-2 w-40"
        >
            Agregar Otro Detalle
        </button>
    </div>
);