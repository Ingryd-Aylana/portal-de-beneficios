import React, { useState } from "react";
import { X } from "lucide-react";
import "../styles/Modal.css";

export default function CadastroColaboradorModal({ open, onClose, onSave, beneficios }) {
  if (!open) return null;

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    matricula: "",
    beneficio: "",
    valor: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function salvar() {
    if (!form.nome || !form.cpf || !form.matricula || !form.beneficio) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    onSave(form);
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">

        {/* HEADER */}
        <div className="modal-header">
          <h2>Cadastrar colaborador</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <div className="modal-body">

          <div className="field">
            <label>Nome *</label>
            <input
              type="text"
              name="nome"
              className="input"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome completo"
            />
          </div>

          <div className="field">
            <label>CPF *</label>
            <input
              type="text"
              name="cpf"
              className="input"
              value={form.cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="field">
            <label>Matrícula *</label>
            <input
              type="text"
              name="matricula"
              className="input"
              value={form.matricula}
              onChange={handleChange}
              placeholder="Ex: 4521"
            />
          </div>

          <div className="field">
            <label>Benefício *</label>
            <select
              name="beneficio"
              value={form.beneficio}
              onChange={handleChange}
              className="input"
            >
              <option value="">Selecione...</option>
              {beneficios.map((b) => (
                <option key={b.id} value={b.tipo}>
                  {b.tipo} – {b.provedor}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Valor *</label>
            <input
              type="number"
              name="valor"
              className="input"
              value={form.valor}
              onChange={handleChange}
              placeholder="R$"
            />
          </div>

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="button ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" onClick={salvar}>
            Salvar
          </button>
        </div>

      </div>
    </div>
  );
}
