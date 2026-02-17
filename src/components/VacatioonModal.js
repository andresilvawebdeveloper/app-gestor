import React, { useState, useEffect } from 'react';
import { useVacationCalc } from '../hooks/useVacationCalc';
import { vacationProvider } from '../services/api';

const VacationModal = ({ isOpen, onClose, employees, onSave }) => {
  const { calculateWorkDays, hasEnoughBalance, checkOverlap } = useVacationCalc();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
  });

  const [calcDays, setCalcDays] = useState(0);
  const [error, setError] = useState('');

  // Recalcular dias sempre que as datas mudarem
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const days = calculateWorkDays(new Date(formData.startDate), new Date(formData.endDate));
      setCalcDays(days);
      
      // Validação imediata de saldo
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
    if (error) return;

    try {
      const newVacation = {
        employee_id: formData.employeeId,
        start_date: formData.startDate,
        end_date: formData.endDate,
        work_days: calcDays
      };

      await vacationProvider.create(newVacation);
      onSave(); // Atualiza o Dashboard
      onClose(); // Fecha o modal
    } catch (err) {
      setError('Erro ao gravar férias. Verifique sobreposições.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Marcar Novas Férias</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selecionar Empregado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
            <select 
              required
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.employeeId}
              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
            >
              <option value="">Selecione um colaborador...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} (Saldo: {emp.totalDays - emp.used})</option>
              ))}
            </select>
          </div>

          {/* Selecionar Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <input 
                type="date" 
                required
                className="w-full border-gray-300 rounded-lg shadow-sm"
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input 
                type="date" 
                required
                className="w-full border-gray-300 rounded-lg shadow-sm"
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          {/* Resumo do Cálculo */}
          {calcDays > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm font-semibold">
                Total de dias úteis: <span className="text-lg">{calcDays}</span>
              </p>
              <p className="text-blue-600 text-xs text-opacity-75">(Fins de semana excluídos)</p>
            </div>
          )}

          {/* Mensagens de Erro */}
          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-red-600 text-xs font-bold">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!!error || !formData.employeeId}
              className={`px-6 py-2 rounded-lg font-bold text-white transition ${
                error || !formData.employeeId ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
              }`}
            >
              Confirmar Marcação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VacationModal;