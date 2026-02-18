import React, { useState, useEffect } from 'react';
import { useVacationCalc } from '../hooks/useVacationCalc';
import { vacationProvider } from '../services/api';

const VacationModal = ({ isOpen, onClose, employees, onSave }) => {
  const { calculateWorkDays } = useVacationCalc();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
  });

  const [calcDays, setCalcDays] = useState(0);
  const [error, setError] = useState('');

  // Lógica de cálculo e validação em tempo real
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start > end) {
        setError('A data de início não pode ser posterior à data de fim.');
        setCalcDays(0);
        return;
      }

      const days = calculateWorkDays(start, end);
      setCalcDays(days);
      
      const emp = employees.find(e => e.id === parseInt(formData.employeeId));
      if (emp && days > (emp.totalDays - emp.used)) {
        setError('Saldo insuficiente para este período.');
      } else {
        setError('');
      }
    }
  }, [formData, employees, calculateWorkDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error || !formData.employeeId) return;

    try {
      const newVacation = {
        employee_id: formData.employeeId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        work_days: calcDays
      };

      await vacationProvider.create(newVacation);
      onSave(); // Atualiza o Dashboard.js
      onClose(); // Fecha o modal
      setFormData({ employeeId: '', startDate: '', endDate: '' }); // Reset
    } catch (err) {
      setError('Erro ao gravar férias. Verifique se existem sobreposições.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Marcar Férias</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seleção do Colaborador */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Colaborador</label>
            <select 
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            >
              <option value="">Selecione um nome...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (Disponível: {emp.totalDays - emp.used} dias)
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Início</label>
              <input 
                type="date" 
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fim</label>
              <input 
                type="date" 
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          {/* Feedback de Dias Úteis */}
          {calcDays > 0 && !error && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-green-800 text-sm">
                Esta marcação consumirá <strong>{calcDays} dias úteis</strong> do saldo.
              </p>
            </div>
          )}

          {/* Alertas de Erro */}
          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-red-600 text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!!error || !formData.employeeId || !formData.startDate}
              className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                error || !formData.employeeId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationModal;