import React from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  HeartHandshake, 
  MapPin, 
  ShieldAlert, 
  Ambulance, 
  Activity,
  Flame,
  UserX
} from 'lucide-react';

export default function EmergencyPage() {
  const emergencyContacts = [
    { name: "Emergency Medical Services / Ambulance (India)", number: "108", desc: "Immediate ambulance dispatch and trauma assistance", priority: true },
    { name: "National Emergency Number", number: "112", desc: "All-in-one emergency dispatch (Police, Fire, Medical)" },
    { name: "Women Helpline", number: "1091", desc: "24/7 dedicated support" },
    { name: "Tele-MANAS Mental Health Helpline", number: "14416", desc: "Free 24/7 tele-counseling support across India" },
    { name: "US / Canada Emergency", number: "911", desc: "North America emergency dispatch" },
    { name: "UK Emergency Services", number: "999", desc: "United Kingdom immediate response" }
  ];

  const redFlags = [
    {
      title: "Acute Chest Pain or Pressure",
      desc: "Sensation of crushing, squeezing, or pain radiating to jaw, left arm, or back."
    },
    {
      title: "Severe Difficulty Breathing",
      desc: "Inability to speak in full sentences, sudden wheezing, blue-tinted lips, or choking."
    },
    {
      title: "Sudden Weakness / Stroke Symptoms (FAST)",
      desc: "Facial drooping, Arm weakness, Slurred speech — Time to call emergency services immediately."
    },
    {
      title: "Loss of Consciousness or Fainting",
      desc: "Unresponsiveness, sudden confusion, seizures, or collapse."
    },
    {
      title: "Uncontrolled Bleeding or Head Trauma",
      desc: "Deep puncture wounds, high volume blood loss, or head injuries with nausea/vomiting."
    },
    {
      title: "Severe Anaphylactic Allergic Reaction",
      desc: "Swelling of throat, tongue, severe hives, or rapid drop in alertness."
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Alert Header Banner */}
      <div className="bg-rose-600 text-white rounded-3xl p-8 shadow-xl shadow-rose-600/20 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <span className="text-xs uppercase font-bold tracking-widest text-rose-100">Immediate Action Protocol</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Emergency Medical Guidance</h1>
        <p className="text-rose-100 text-sm max-w-2xl leading-relaxed">
          If you or someone nearby is experiencing acute, life-threatening symptoms, do not use chat or wait for analysis. Call emergency services immediately.
        </p>
      </div>

      {/* Emergency Phone Numbers Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Ambulance className="w-5 h-5 text-rose-600" />
          <span>Instant Emergency Contacts</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                contact.priority 
                  ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300' 
                  : 'bg-white border-slate-200/80 shadow-sm'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1">{contact.name}</span>
                <p className="text-[11px] text-slate-500 mb-4">{contact.desc}</p>
              </div>

              <a
                href={`tel:${contact.number}`}
                className={`py-2 px-3 rounded-xl font-mono text-center font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  contact.priority 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call {contact.number}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Red Flag Symptoms Guide */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800">Critical Red Flag Warning Signs</h2>
          <p className="text-xs text-slate-500">Do not delay treatment if experiencing any of the following:</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {redFlags.map((flag, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                {flag.title}
              </span>
              <p className="text-xs text-slate-600 leading-relaxed pl-3.5">{flag.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Boundary Statement */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-center">
        MediMate AI is designed as a personal lifestyle health companion and is not equipped to handle acute life-support diagnostics.
      </div>
    </div>
  );
}
