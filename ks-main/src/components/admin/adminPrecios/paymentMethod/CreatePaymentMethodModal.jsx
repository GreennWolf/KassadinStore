// components/PaymentMethods/CreatePaymentMethodModal.js
import React from 'react';
import { Modal } from "../Modal";
import { PaymentMethodDetails } from "./PaymentMethodDetails";
import { CurrencySelector } from "./CurrencySelector";

export const CreatePaymentMethodModal = ({
    isOpen,
    onClose,
    newMethod,
    onMethodChange,
    onDetailChange,
    onRemoveDetail,
    onAddDetail,
    availableCurrencies,
    onCurrencyChange,
    onRestrictionChange,
    onSubmit,
    isLoading
}) => (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Agregar Nuevo Método de Pago"
    >
        <div className="flex flex-col max-h-[80vh] overflow-y-auto">
            <input
                type="text"
                placeholder="Método"
                value={newMethod.method}
                onChange={(e) => onMethodChange(e.target.value)}
                className="border p-2 m-2 bg-black text-white"
                required
            />
            
            <PaymentMethodDetails
                details={newMethod.details}
                onDetailChange={onDetailChange}
                onRemoveDetail={onRemoveDetail}
                onAddDetail={onAddDetail}
                isEditing={false}
            />

            <CurrencySelector
                currencies={availableCurrencies}
                selectedCurrencies={newMethod.currencies || []}
                onCurrencyChange={(id, checked) => onCurrencyChange(id, checked, false)}
                isRestricted={newMethod.isRestricted}
                onRestrictionChange={(checked) => onRestrictionChange(checked, false)}
            />

            <div className="flex justify-end mt-4">
                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className={`bg-GOLD_2 text-white px-4 py-2 rounded mr-2 ${isLoading ? 'opacity-50' : ''}`}
                >
                    {isLoading ? 'Creando...' : 'Crear'}
                </button>
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </Modal>
);