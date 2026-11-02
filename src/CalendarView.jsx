import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import skLocale from "@fullcalendar/core/locales/sk";

export default function CalendarView({ events, onEventClick, onSelect }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      locale={skLocale}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      buttonText={{ month: "Mesiac", week: "Týždeň", day: "Deň" }}
      events={events}
      selectable
      selectMirror
      nowIndicator
      height="auto"
      eventClick={(info) => onEventClick(info.event.extendedProps.todo)}
      select={onSelect}
    />
  );
}
