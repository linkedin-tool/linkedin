"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "./button";

interface DateTimePickerProps {
  selectedDate: string;
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  minDate?: string;
}

export function DateTimePicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  minDate
}: DateTimePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Hvis der er valgt en dato, vis måneden for den dato
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const today = new Date();
  // Reset today to midnight for date comparison only (no time)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const minDateObj = minDate ? new Date(minDate) : todayMidnight;

  // Generer kalender dage
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    
    // Start fra mandag i ugen hvor måneden starter
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      // Sammenlign lokal dato uden timezone konvertering
      const year = date.getFullYear();
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateString = `${year}-${monthStr}-${day}`;
      const isSelected = selectedDate === dateString;
      
      // Reset date to midnight for comparison - only disable dates BEFORE today (not today itself)
      const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const isDisabled = dateMidnight < todayMidnight;
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isDisabled
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    // Reset date to midnight for comparison
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Only block dates BEFORE today (allow today)
    if (dateMidnight < todayMidnight) return;
    
    // Brug lokal dato uden timezone konvertering
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onDateChange(dateString);
    
    // Hvis der ikke er valgt et tidspunkt endnu, sæt default baseret på om det er i dag
    if (!selectedTime) {
      // Hvis det er i dag, sæt default til næste time (eller minimum 1 time frem)
      if (dateMidnight.getTime() === todayMidnight.getTime()) {
        const now = new Date();
        const nextHour = now.getHours() + 1;
        const defaultHour = nextHour >= 24 ? '00' : nextHour.toString().padStart(2, '0');
        onTimeChange(`${defaultHour}:00`);
      } else {
        // For fremtidige datoer, sæt default til 12:00
        onTimeChange('12:00');
      }
    } else {
      // Valider at det valgte tidspunkt ikke er i fortiden hvis det er i dag
      if (dateMidnight.getTime() === todayMidnight.getTime()) {
        const now = new Date();
        const [year, month, day] = dateString.split('-').map(Number);
        const [hour, minute] = selectedTime.split(':');
        const selectedDateTime = new Date(year, month - 1, day, parseInt(hour), parseInt(minute));
        
        if (selectedDateTime < now) {
          // Hvis det er i dag og tidspunktet er i fortiden, sæt til næste time
          const nextHour = now.getHours() + 1;
          const defaultHour = nextHour >= 24 ? '00' : nextHour.toString().padStart(2, '0');
          onTimeChange(`${defaultHour}:00`);
        }
      }
    }
  };

  // Generer timer og minutter for hjul-picker
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Parse nuværende tid
  const [currentHour, currentMinute] = selectedTime ? selectedTime.split(':') : ['12', '00'];

  const handleTimeChange = (hour: string, minute: string) => {
    const timeString = `${hour}:${minute}`;
    
    // Valider at tidspunktet ikke er i fortiden hvis det er i dag
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const selectedDateTime = new Date(year, month - 1, day, parseInt(hour), parseInt(minute));
      const now = new Date();
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const selectedDateMidnight = new Date(year, month - 1, day);
      
      // Hvis det er i dag og tidspunktet er i fortiden, sæt til næste time
      if (selectedDateMidnight.getTime() === todayMidnight.getTime() && selectedDateTime < now) {
        const nextHour = now.getHours() + 1;
        const defaultHour = nextHour >= 24 ? '00' : nextHour.toString().padStart(2, '0');
        // Brug setTimeout for at undgå rekursivt kald under rendering
        setTimeout(() => onTimeChange(`${defaultHour}:00`), 0);
        return;
      }
    }
    
    onTimeChange(timeString);
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    
    // Parse dato og tid direkte uden timezone konvertering
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hour, minute] = selectedTime.split(':');
    const date = new Date(year, month - 1, day, parseInt(hour), parseInt(minute));
    
    return date.toLocaleString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Vælg dato
        </label>
        
        <div className="bg-gray-100 rounded-2xl p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-white rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {currentMonth.toLocaleDateString('da-DK', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-white rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDateSelect(day.date)}
                disabled={day.isDisabled}
                className={`
                  p-2 text-sm rounded-lg transition-all duration-200 relative
                  ${day.isCurrentMonth 
                    ? day.isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-lg'
                      : day.isToday
                      ? 'bg-blue-100 text-blue-600 font-semibold'
                      : day.isDisabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-900 hover:bg-white hover:shadow-sm'
                    : 'text-gray-400'
                  }
                `}
              >
                {day.date.getDate()}
                {day.isToday && !day.isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time Picker - Apple Style Wheels */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Vælg tidspunkt
          </label>
          
          <div className="bg-gray-100 rounded-2xl px-6 pt-4 pb-8">
            <div className="flex items-center justify-center gap-4">
              {/* Hour Wheel */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium text-gray-500 mb-3">Timer</div>
                <div className="relative">
                  <select
                    value={currentHour}
                    onChange={(e) => handleTimeChange(e.target.value, currentMinute)}
                    className="appearance-none bg-white border-0 rounded-2xl px-4 py-2 text-base font-normal text-gray-900 focus:outline-none focus:ring-0 cursor-pointer min-w-[80px] text-center shadow-lg"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      fontSize: '16px',
                      transform: 'scale(1.3)',
                      transformOrigin: 'center'
                    }}
                  >
                    {hours.map(hour => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Separator */}
              <div className="text-2xl font-light text-gray-400 mt-6 mx-2">:</div>

              {/* Minute Wheel */}
              <div className="flex flex-col items-center">
                <div className="text-xs font-medium text-gray-500 mb-3">Minutter</div>
                <div className="relative">
                  <select
                    value={currentMinute}
                    onChange={(e) => handleTimeChange(currentHour, e.target.value)}
                    className="appearance-none bg-white border-0 rounded-2xl px-4 py-2 text-base font-normal text-gray-900 focus:outline-none focus:ring-0 cursor-pointer min-w-[80px] text-center shadow-lg"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 8px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '16px',
                      fontSize: '16px',
                      transform: 'scale(1.3)',
                      transformOrigin: 'center'
                    }}
                  >
                    {minutes.map(minute => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected DateTime Preview */}
      {selectedDate && selectedTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Planlagt udgivelse:</span>
          </div>
          <p className="text-blue-900 font-semibold text-lg">
            {formatSelectedDateTime()}
          </p>
        </div>
      )}
    </div>
  );
}
