import { eachDayOfInterval, isWeekend, isBefore, startOfDay } from 'date-fns';

export const useVacationCalc = () => {
  
  // 1. Calcular dias úteis (exclui Sábados e Domingos)
  const calculateWorkDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.filter(day => !isWeekend(day)).length;
  };

  // 2. Validar se o empregado tem saldo suficiente
  const hasEnoughBalance = (requestedDays, availableDays) => {
    return requestedDays <= availableDays;
  };

  // 3. Verificar sobreposição de datas
  const checkOverlap = (newStart, newEnd, existingVacations) => {
    return existingVacations.some(vacation => {
      return (newStart <= vacation.end && newEnd >= vacation.start);
    });
  };

  // 4. Determinar se a data já passou (para status "Usado")
  const isPastVacation = (endDate) => {
    return isBefore(startOfDay(new Date(endDate)), startOfDay(new Date()));
  };

  return {
    calculateWorkDays,
    hasEnoughBalance,
    checkOverlap,
    isPastVacation
  };
};