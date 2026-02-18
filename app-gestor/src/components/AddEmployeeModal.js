import React, { useState } from 'react';
import { employeeProvider } from '../services/api';

const AddEmployeeModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    totaldays: 22,
    color: '#3b82f6'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) return alert("Selecione a categoria profissional.");

    setIsSubmitting(true);
    try {
      await employeeProvider.create(formData);
      onSave();
      onClose();
      setFormData({ name: '', role: '', totaldays: 22, color: '#3b82f6' });
    } catch (error) {
      alert("Erro ao gravar na base de dados AAF. Verifique as colunas no Supabase.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-2xl border border-gray-200 relative">
        <h2 className="text-2xl font-black text-gray-900 mb-8">Novo Colaborador</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">Nome Completo</label>
            <input 
              type="text" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 font-semibold text-gray-800"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">Categoria</label>
            <select 
              required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 font-semibold text-gray-800"
              value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Condutor">Condutor</option>
              <option value="Armazém">Armazém</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">Dias de Direito</label>
              <input 
                type="number" className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-800"
                value={formData.totaldays} onChange={(e) => setFormData({...formData, totaldays: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-2">Cor</label>
              <input 
                type="color" className="w-full h-[60px] p-2 bg-gray-50 border-2 border-gray-100 rounded-2xl cursor-pointer"
                value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
              {isSubmitting ? 'A gravar...' : 'Adicionar à Equipa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;