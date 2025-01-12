import React from 'react';
import { Modal } from "../Modal";
import { PaymentMethodDetails } from "./PaymentMethodDetails";
import { CurrencySelector } from "./CurrencySelector";

export const EditPaymentMethodModal = ({
    isOpen,
    onClose,
    selectedMethod,
    onMethodChange,
    onDetailChange,
    onRemoveDetail,
    onAddDetail,
    availableCurrencies,
    onCurrencyChange,
    onRestrictionChange,
    onActiveChange,
    onSubmit,
    isLoading
}) => {
    return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Método de Pago"
    >
        {selectedMethod && (
            <div className="flex flex-col max-h-[80vh] overflow-y-auto">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={selectedMethod.active || false}
                        onChange={(e) => onActiveChange(e.target.checked)}
                        className="ml-2"
                        id="active"
                    />
                    <label htmlFor="active" className="text-sm">Activo</label>
                </div>
                <input
                    type="text"
                    placeholder="Método"
                    value={selectedMethod.method}
                    onChange={(e) => onMethodChange(e.target.value)}
                    className="border p-2 m-2 bg-black"
                    required
                />
                
                <PaymentMethodDetails
                    details={selectedMethod.details}
                    onDetailChange={onDetailChange}
                    onRemoveDetail={onRemoveDetail}
                    onAddDetail={onAddDetail}
                    isEditing={true}
                />

                <CurrencySelector
                    currencies={availableCurrencies}
                    selectedCurrencies={selectedMethod.currencies || []}
                    onCurrencyChange={(id, checked) => onCurrencyChange(id, checked, true)}
                    isRestricted={selectedMethod.isRestricted}
                    onRestrictionChange={(checked) => onRestrictionChange(checked, true)}
                />

                <div className="flex justify-end mt-4">
                    <button
                        onClick={onSubmit}
                        disabled={isLoading}
                        className={`bg-GOLD_2 text-white px-4 py-2 rounded mr-2 ${isLoading ? 'opacity-50' : ''}`}
                    >
                        {isLoading ? 'Actualizando...' : 'Actualizar'}
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
        )}
    </Modal>
)};