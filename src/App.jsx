import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [secondaryData, setSecondaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState("");
  const [day, setDay] = useState("");
  const [numPeople, setNumPeople] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }, [filteredData]);

  const validateMainHeaders = (headers) => {
    return (
      headers.length >= 5 &&
      headers[0].toLowerCase() === "nazwisko" &&
      headers[1].toLowerCase() === "suma godzin" &&
      (headers[2].toLowerCase() === "płeć" || headers[2].toLowerCase() === "plec") &&
      headers[3].toLowerCase() === "l4" &&
      headers[4].toLowerCase() === "gd"
    );
  };

  const validateSecondaryHeaders = (headers) => {
    return (
      headers.length >= 3 &&
      headers[0].toLowerCase() === "gd" &&
      headers[1].toLowerCase() === "zakres godz." &&
      (headers[2].toLowerCase() === "dzień" || headers[2].toLowerCase() === "dzien")
    );
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target.result;
      const wb = XLSX.read(binaryStr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const [headerRow, ...rows] = parsedData;

      if (type === "main") {
        if (!validateMainHeaders(headerRow)) {
          alert("Błąd: Niepoprawny format pliku głównego.");
          return;
        }
        const formattedData = rows.map((row) => ({
          name: row[0] || "Nieznane",
          hours: parseFloat(row[1]) || 0,
          gender: row[2] || "M",
          l4: parseInt(row[3]) || 0,
          gd: parseInt(row[4]) || null,
        }));
        setData(formattedData);
      } else {
        if (!validateSecondaryHeaders(headerRow)) {
          alert("Błąd: Niepoprawny format pliku pomocniczego.");
          return;
        }
        const formattedData = rows.map((row) => ({
          gd: parseInt(row[0]) || null,
          workHours: row[1] || "",
          day: row[2] || "",
        }));
        setSecondaryData(formattedData);
      }
    };
    reader.readAsBinaryString(file);
  };

  const applyFilter = (mode) => {
    let result = [...data].filter((item) => !item.l4);
  
    const parseTime = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
  
    const rangesOverlap = (range1, range2) => {
      const [start1, end1] = range1.split("-").map(t => parseTime(t.trim()));
      const [start2, end2] = range2.split("-").map(t => parseTime(t.trim()));
      return Math.max(start1, start2) < Math.min(end1, end2);
    };
  
    if (timeRange && day) {
      const blockedGd = new Set(
        secondaryData
          .filter(entry => 
            entry.day.toLowerCase() === day.toLowerCase() &&
            entry.workHours && 
            rangesOverlap(entry.workHours, timeRange)
          )
          .map(entry => entry.gd)
      );
      result = result.filter(item => !blockedGd.has(item.gd));
    }
  
    result.sort((a, b) => a.hours - b.hours);
  
    if (mode === "krzepa") result = result.filter(item => item.gender !== "K");
    if (mode === "lajcik") result = result.filter(item => item.gender !== "M");
  
    setFilteredData(result.slice(0, parseInt(numPeople) || 0));
  };

  const filteredSearchResults = filteredData.filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="filters">
        <label className="file-input">
          <input type="file" accept=".xlsx" onChange={(e) => handleFileUpload(e, "main")} />
        </label>
        <label className="file-input">
          <input type="file" accept=".xlsx" onChange={(e) => handleFileUpload(e, "secondary")} />
        </label>
        <input type="text" placeholder="Przedział godzinowy, np. 10:00-15:00" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="input" />
        <input type="text" placeholder="Dzień tygodnia, np. poniedziałek" value={day} onChange={(e) => setDay(e.target.value)} className="input" />
        <input type="number" placeholder="Liczba osób, np. 10" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} className="input" />
        <div className="button-group">
          <button onClick={() => applyFilter("sprawiedliwe")} className="button">SPRAWIEDLIWIE</button>
          <button onClick={() => applyFilter("krzepa")} className="button">KRZEPA</button>
          <button onClick={() => applyFilter("lajcik")} className="button">LAJCIK</button>
        </div>
      </div>
      <div className="search-container" style={{ marginBottom: "20px", width: "100%" }}>
        <input type="text" placeholder="Wyszukaj nazwisko..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
      </div>
      <div className="grid-container">
        <div className="grid">
          {filteredSearchResults.map((item, index) => (
            <div key={index} className="grid-item">
              <p>{item.name}</p>
              <p>{item.hours}h</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
