import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import "./App.css";
import { api } from "./services/api";

// Definir nomes dos meses
const monthNames: string[] = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Interface para um agendamento de carro
interface Booking {
  name: string;
  car: string;
  placa: string;
  inital_date: string; 
  final_Date: string; 
}

// Interface para os dados do formulário
interface FormData {
  name: string;
  car: string;
  placa: string;
  inital_date: string;
  final_Date: string; 
}

// Função para formatar data e hora
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  };
  return new Intl.DateTimeFormat('pt-BR', options).format(date).replace(',', ' às ');
};

const App: React.FC = () => {
  const today = new Date();
  const year: number = today.getFullYear();
  const month: number = today.getMonth();
  const currentDay: number = today.getDate();

  const [bookings, setBookings] = useState<{ [key: number]: Booking[] }>({});
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalActive, setModalActive] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    car: "",
    placa: "",
    inital_date: "",
    final_Date: "",
  });

  const daysInMonth: number = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    // Carregar agendamentos ao carregar a página
    const fetchBookings = async () => {
      try {
        const response = await api.get(`/Appointment`); // Atualizado para o endpoint correto
        const data = response.data;

        const loadedBookings: { [key: number]: Booking[] } = {};
        data.forEach((booking: any) => {
          const day: number = new Date(booking.inital_date).getDate();
          if (!loadedBookings[day]) {
            loadedBookings[day] = [];
          }
          loadedBookings[day].push({
            name: booking.name,
            car: booking.car,
            placa: booking.placa,
            inital_date: booking.inital_date,
            final_Date: booking.final_Date,
          });
        });
        setBookings(loadedBookings);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      }
    };

    fetchBookings();
  }, [year, month]);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setModalActive(true);
  };

  const handleCloseModal = () => {
    setModalActive(false);
    setFormData({
      name: "",
      car: "",
      placa: "",
      inital_date: "",
      final_Date: "",
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedDay === null) return;

    const { name, car, placa, inital_date, final_Date } = formData;
    const formattedInitialDate = new Date(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}T${inital_date}:00`).toISOString();
    const formattedFinalDate = new Date(`${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}T${final_Date}:00`).toISOString();

    // Verificação de agendamentos sobrepostos
    const startTime = new Date(formattedInitialDate).getTime();
    const endTime = new Date(formattedFinalDate).getTime();
    const isOverlapping = bookings[selectedDay]?.some((booking) => {
      const bookingStart = new Date(booking.inital_date).getTime();
      const bookingEnd = new Date(booking.final_Date).getTime();
      return (
        startTime < bookingEnd && endTime > bookingStart && booking.car === car
      );
    });

    if (isOverlapping) {
      alert("Erro: Já existe um agendamento para este horário com este carro.");
      return;
    }

    try {
      const response = await api.post(`/create-appointment`, {
        name,
        car,
        placa,
        inital_date: formattedInitialDate,
        final_Date: formattedFinalDate,
      });

      console.log("Agendamento criado com sucesso:", response.data);

      setBookings((prevBookings) => {
        const updatedBookings = { ...prevBookings };
        if (!updatedBookings[selectedDay]) {
          updatedBookings[selectedDay] = [];
        }
        updatedBookings[selectedDay].push({ name, car, placa, inital_date: formattedInitialDate, final_Date: formattedFinalDate });
        return updatedBookings;
      });

      handleCloseModal();
    } catch (error: any) {
      if (error.response) {
        alert(`Erro: ${error.response.data.error || "Falha ao salvar o agendamento."}`);
      } else {
        alert("Erro ao conectar ao servidor.");
      }
    }
  };

  const renderBookings = () => {
    if (selectedDay === null || !bookings[selectedDay] || bookings[selectedDay].length === 0) {
      return <p>Não há agendamentos para este dia.</p>;
    }

    return (
      <div>
        <h3>Agendamentos:</h3>
        {bookings[selectedDay].map((booking, index) => (
          <div key={index} className="booking">
            <p><strong>Nome:</strong> {booking.name}</p>
            <p><strong>Carro:</strong> {booking.car}</p>
            <p><strong>Placa:</strong> {booking.placa}</p>
            <p><strong>Horário de Início:</strong> {formatDateTime(booking.inital_date)}</p>
            <p><strong>Horário de Término:</strong> {formatDateTime(booking.final_Date)}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="App">
      <div className="calendar-header">
        <h1>Hoje: {currentDay} de {monthNames[month]} de {year}</h1>
      </div>

      <div className="calendar">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day: number = i + 1;
          const isPast: boolean = day < currentDay;
          return (
            <div
              key={day}
              className={`day ${isPast ? "past" : ""}`}
              onClick={() => !isPast && handleDayClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {modalActive && selectedDay !== null && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCloseModal}>
              Fechar
            </button>
            <h2>Agendar Carro para o dia {selectedDay}</h2>
            <form onSubmit={handleSubmit} className="booking-form">
              <label htmlFor="name">Nome:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label htmlFor="car">Carro:</label>
              <input
                type="text"
                id="car"
                name="car"
                value={formData.car}
                onChange={handleChange}
                required
              />

              <label htmlFor="placa">Placa:</label>
              <input
                type="text"
                id="placa"
                name="placa"
                value={formData.placa}
                onChange={handleChange}
                required
              />

              <label htmlFor="inital_date">Horário de Início:</label>
              <input
                type="time"
                id="inital_date"
                name="inital_date"
                value={formData.inital_date}
                onChange={handleChange}
                required
              />

              <label htmlFor="final_Date">Horário de Término:</label>
              <input
                type="time"
                id="final_Date"
                name="final_Date"
                value={formData.final_Date}
                onChange={handleChange}
                required
              />

              <button type="submit">Agendar</button>
            </form>

            {renderBookings()}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
