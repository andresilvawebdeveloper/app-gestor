import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { employeeProvider, vacationProvider, absenceProvider } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import VacationModal from '../components/VacationModal';
import AddEmployeeModal from '../components/AddEmployeeModal';
import LogoEmpresa from '../assets/logoAAF.jpg'; 

// 1. Definição Global dos Feriados
const FERIADOS_2026 = [
  '2026-01-01', '2026-04-03', '2026-04-05', '2026-04-25',
  '2026-05-01', '2026-06-04', '2026-06-10', '2026-08-15',
  '2026-10-05', '2026-11-01', '2026-12-01', '2026-12-08', '2026-12-25'
];

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef();
  
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [empRes, vacRes, absRes] = await Promise.all([
        employeeProvider.getAll(),
        vacationProvider.getAll(),
        absenceProvider.getAll()
      ]);
      setEmployees(empRes.data || []);
      setVacations(vacRes.data || []);
      setAbsences(absRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAbsence = async (emp) => {
    const dataFalta = prompt(`Data da falta para ${emp.name} (AAAA-MM-DD):`, new Date().toISOString().split('T')[0]);
    if (!dataFalta) return;

    if (FERIADOS_2026.includes(dataFalta)) {
      alert(`Impossível registar falta: O dia ${dataFalta} é feriado nacional!`);
      return;
    }

    const motivo = prompt("Motivo da falta (ex: Aviso Prévio, Doença, Sem Aviso):", "Aviso Prévio");
    if (!motivo) return;
    
    try {
      await absenceProvider.create({
        employee_id: emp.id,
        employee_name: emp.name,
        absence_date: dataFalta,
        reason: motivo
      });
      fetchData();
    } catch (error) {
      alert("Erro ao registar falta.");
    }
  };

  const exportToPDF = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
    pdf.save(`Mapa_Ferias_AAF_${new Date().getFullYear()}.pdf`);
  };

  const handleEventClick = async (clickInfo) => {
    if (clickInfo.event.title === 'FERIADO') return; // Bloqueia clique em feriados

    if (window.confirm(`Deseja cancelar as férias de: ${clickInfo.event.title}?`)) {
      try {
        await vacationProvider.delete(parseInt(clickInfo.event.id));
        fetchData();
      } catch (error) {
        alert("Erro ao remover férias.");
      }
    }
  };

  const activeAlerts = () => {
    const today = new Date().toISOString().split('T')[0];
    return vacations
      .filter(v => v.start_date >= today)
      .map(v => ({ ...v, role: employees.find(e => e.id === v.employee_id)?.role }))
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 5);
  };

  // 2. Unificação de Eventos (Férias + Feriados)
  const calendarEvents = [
    // Férias dos colaboradores
    ...vacations.map(v => ({
      id: v.id.toString(),
      title: v.employee_name,
      start: v.start_date,
      end: v.end_date,
      backgroundColor: v.employee_color,
      borderColor: v.employee_color,
      allDay: true
    })),
    // Bloqueio visual de Feriados
    ...FERIADOS_2026.map(data => ({
      title: 'FERIADO',
      start: data,
      allDay: true,
      display: 'background',
      backgroundColor: '#ffcccc' 
    }))
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 font-black text-blue-600 uppercase tracking-widest text-sm">
      A ligar à Nuvem AAF...
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden" ref={dashboardRef}>
      <aside className="w-85 bg-white shadow-2xl flex flex-col z-10 border-r border-gray-200">
        <div className="p-8 border-b flex justify-center bg-white">
          <img src={LogoEmpresa} alt="Logo AAF" className="h-16 w-auto object-contain" />
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Colaborador</h3>
            <button 
              onClick={() => setIsAddEmpModalOpen(true)}
              className="text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              + NOVO
            </button>
          </div>

          <div className="space-y-4">
            {employees.map(emp => {
              const total = emp.totaldays || 22;
              const usado = emp.used || 0;
              const restante = total - usado;
              const percentagem = Math.min((usado / total) * 100, 100);
              const numFaltas = absences.filter(a => a.employee_id === emp.id).length;

              return (
                <div key={emp.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-lg transition-all group relative">
                  <button 
                    onClick={async () => { if(window.confirm(`Apagar ${emp.name}?`)) { await employeeProvider.delete(emp.id); fetchData(); } }}
                    className="absolute top-2 right-2 text-[8px] bg-red-50 text-red-500 px-2 py-1 rounded opacity-0 group-hover:opacity-100 font-bold transition-all"
                  >
                    REMOVER
                  </button>
                  
                  <div className="flex items-center gap-3 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color }}></span>
                    <p className="font-bold text-gray-800 text-sm tracking-tight">{emp.name}</p>
                  </div>
                  <p className="text-[9px] text-blue-600 font-black uppercase ml-5 mb-3 tracking-widest">{emp.role}</p>
                  
                  <div className="w-[calc(100%-20px)] bg-gray-200 rounded-full h-2 ml-5 overflow-hidden">
                    <div className="h-2 transition-all duration-700 ease-out" style={{ width: `${percentagem}%`, backgroundColor: emp.color }}></div>
                  </div>

                  <div className="flex justify-between items-end ml-5 mt-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 leading-none">{restante}</span>
                      <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Dias Restantes</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 font-bold italic">Total: {total}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center ml-5">
                    <span className={`text-[10px] font-black uppercase ${numFaltas > 3 ? 'text-red-600' : 'text-orange-600'}`}>
                       {numFaltas} Faltas
                    </span>
                    <button 
                      onClick={() => handleAddAbsence(emp)} 
                      className="text-[8px] bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-black hover:bg-orange-600 hover:text-white"
                    >
                      + REGISTAR
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 min-h-full">
          <header className="mb-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mapa de Férias</h1>
              <p className="text-gray-400 font-medium text-xs mt-1">Ligado ao Supabase Cloud • AAF v2.1</p>
            </div>
            
            <div className="flex gap-4">
              <button onClick={exportToPDF} className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-4 rounded-2xl font-bold hover:bg-gray-900 hover:text-white active:scale-95 transition-all">Exportar PDF</button>
              <button onClick={() => setIsVacationModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition-all">Marcar Férias</button>
            </div>
          </header>

          <div className="calendar-container border border-gray-100 rounded-3xl p-4 shadow-inner bg-gray-50/30">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="pt"
              events={calendarEvents}
              height="65vh"
              eventClick={handleEventClick}
              dayMaxEvents={true}
              eventClassNames="font-bold text-[11px] rounded-lg border-none px-2 py-1 cursor-pointer"
            />
          </div>
        </div>
      </main>

      <VacationModal isOpen={isVacationModalOpen} onClose={() => setIsVacationModalOpen(false)} employees={employees} vacations={vacations} onSave={fetchData} />
      <AddEmployeeModal isOpen={isAddEmpModalOpen} onClose={() => setIsAddEmpModalOpen(false)} onSave={fetchData} />
    </div>
  );
};

export default Dashboard;