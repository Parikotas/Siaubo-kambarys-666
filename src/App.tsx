import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Skull, 
  Zap, 
  Puzzle, 
  Ghost, 
  Calendar, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  ChevronRight,
  Menu,
  X,
  Instagram,
  Facebook,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { lt } from 'date-fns/locale';
import { cn } from './lib/utils';
import { HERO_IMAGE, HISTORY_IMAGE } from './assets/images';

// --- Components ---

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <div className="text-center mb-16">
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-5xl md:text-7xl font-horror text-blood blood-glow mb-4"
    >
      {children}
    </motion.h2>
    {subtitle && (
      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 uppercase tracking-[0.3em] text-sm"
      >
        {subtitle}
      </motion.p>
    )}
  </div>
);

const Button = ({ children, variant = 'primary', className, ...props }: any) => {
  const variants = {
    primary: "bg-blood hover:bg-red-700 text-white shadow-[0_0_15px_rgba(139,0,0,0.5)]",
    outline: "border border-blood text-blood hover:bg-blood/10"
  };
  
  return (
    <button 
      className={cn(
        "px-8 py-4 uppercase tracking-widest font-bold transition-all duration-300 transform active:scale-95",
        variants[variant as keyof typeof variants],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Main App ---

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [participants, setParticipants] = useState(2);
  const [scrolled, setScrolled] = useState(false);
  
  // Booking state
  const [bookingStep, setBookingStep] = useState(1); // 1: Date, 2: Time, 3: Form, 4: Success
  const [availableTimes, setAvailableTimes] = useState<{ time: string, available: boolean }[]>([]);
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (selectedDate && bookingStep === 1) {
      fetchAvailability();
    }
  }, [selectedDate, bookingStep]);

  useEffect(() => {
    if (bookingStep === 1) {
      fetchFullyBookedDates();
    }
  }, [bookingStep]);

  const fetchFullyBookedDates = async () => {
    try {
      const res = await fetch('/api/fully-booked-dates');
      const data = await res.json();
      setFullyBookedDates(data);
    } catch (error) {
      console.error("Failed to fetch fully booked dates", error);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/availability?date=${dateStr}`);
      const data = await res.json();
      setAvailableTimes(data);
    } catch (error) {
      console.error("Failed to fetch availability", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSelect = async (time: string) => {
    if (!selectedDate) return;
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch('/api/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, time })
      });
      
      if (res.ok) {
        setSelectedTime(time);
        setBookingStep(3);
      } else {
        alert("Apgailestaujame, šis laikas ką tik buvo užimtas.");
        fetchAvailability();
      }
    } catch (error) {
      console.error("Failed to lock time", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    
    setIsLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dateStr,
          time: selectedTime,
          ...formData,
          participants
        })
      });

      if (res.ok) {
        setBookingStep(4);
      } else {
        alert("Įvyko klaida rezervuojant. Prašome bandyti dar kartą.");
      }
    } catch (error) {
      console.error("Failed to reserve", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-black selection:bg-blood selection:text-white">
      {/* Scanlines Overlay */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-20 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
      
      {/* Fog Overlay */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="fog-layer absolute top-[-20%] left-[-10%] w-[120%] h-[140%] opacity-40" />
        <div className="fog-layer absolute bottom-[-20%] right-[-10%] w-[120%] h-[140%] opacity-30" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-4",
        scrolled ? "bg-black/90 backdrop-blur-md border-b border-blood/20" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-horror text-3xl text-blood blood-glow cursor-pointer" onClick={() => scrollTo('hero')}>
            666
          </div>
          
          <div className="hidden md:flex gap-8 items-center">
            {['Apie', 'Istorija', 'Kontaktai'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-sm uppercase tracking-widest hover:text-blood transition-colors"
              >
                {item}
              </button>
            ))}
            <Button variant="primary" className="py-2 px-6 text-xs" onClick={() => scrollTo('rezervacija')}>
              Rezervuoti
            </Button>
          </div>

          <button className="md:hidden text-blood" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8"
          >
            {['Apie', 'Istorija', 'Kontaktai'].map((item) => (
              <button 
                key={item} 
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-2xl font-horror text-blood hover:text-white transition-colors"
              >
                {item}
              </button>
            ))}
            <Button variant="primary" className="mt-4" onClick={() => scrollTo('rezervacija')}>
              Rezervuoti
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={HERO_IMAGE} 
            alt="Horror Room" 
            className="w-full h-full object-cover opacity-40 scale-110 animate-[pulse_10s_infinite]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="text-7xl md:text-9xl font-horror text-blood blood-glow mb-6 animate-flicker"
          >
            Siaubo kambarys 666
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl md:text-2xl text-gray-400 uppercase tracking-[0.5em] mb-12 font-light"
          >
            Ar išdrįsi įžengti?
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <Button onClick={() => scrollTo('rezervacija')}>Rezervuoti laiką</Button>
            <Button variant="outline" onClick={() => scrollTo('apie')}>Sužinoti daugiau</Button>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-blood/50 cursor-pointer"
          onClick={() => scrollTo('apie')}
        >
          <ChevronRight className="rotate-90 w-10 h-10" />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="apie" className="py-32 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <SectionTitle subtitle="Kas tavęs laukia">Apie patirtį</SectionTitle>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 text-lg text-gray-400 leading-relaxed"
            >
              <p>
                Tai nėra paprastas pabėgimo kambarys. Tai psichologinis išbandymas, kuriame tavo didžiausios baimės tampa realybe. Panevėžio širdyje įsikūręs „Siaubo kambarys 666“ kviečia tave ir tavo komandą į tamsiausią jūsų gyvenimo nuotykį.
              </p>
              <p>
                Pasiruoškite netikėtiems išgąsčiams, įtemptai atmosferai ir galvosūkiams, kuriuos išspręsti galėsite tik dirbdami kartu. Ar jūsų komanda sugebės išlikti rami, kai aplink tvyro mirtina tyla, o šešėliuose kažkas juda?
              </p>
              <div className="flex items-center gap-3 p-4 bg-blood/10 border border-blood/30 text-blood rounded-lg">
                <AlertTriangle className="flex-shrink-0" />
                <p className="text-sm font-bold uppercase tracking-wider">Rekomenduojame nuo 16 m. (galima tartis)</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <Skull />, title: 'Baimė', desc: 'Grynas siaubas' },
                { icon: <Zap />, title: 'Adrenalinas', desc: 'Širdies plakimas' },
                { icon: <Puzzle />, title: 'Galvosūkiai', desc: 'Aštrus protas' },
                { icon: <Ghost />, title: 'Išgyvenimas', desc: 'Rask išėjimą' },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 bg-black/50 horror-border text-center group hover:bg-blood/5 transition-colors"
                >
                  <div className="text-blood mb-4 flex justify-center scale-125 group-hover:scale-150 transition-transform duration-500">
                    {item.icon}
                  </div>
                  <h3 className="text-white font-bold uppercase tracking-widest mb-2">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section id="istorija" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={HISTORY_IMAGE} 
            alt="History Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <SectionTitle subtitle="Prakeikta vieta">Kambario istorija</SectionTitle>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-black/80 p-12 horror-border backdrop-blur-sm"
          >
            <div className="prose prose-invert max-w-none text-gray-400 italic font-light space-y-8 text-xl text-center">
              <p>
                „Prieš daugelį metų šiame pastate veikė slapta laboratorija, kurioje buvo atliekami eksperimentai su žmogaus baime. Sakoma, kad vienas iš mokslininkų, pamišęs dėl savo tyrimų, užrakino visą savo komandą ir save kambaryje Nr. 666...“
              </p>
              <p>
                „Nuo to laiko niekas jų nematė. Tačiau kaimynai vis dar girdi šnabždesius už sienų, o naktimis pro langus matosi keista raudona šviesa. Žmonės, išdrįsę įžengti į vidų, dingsta be pėdsakų arba grįžta visiškai pasikeitę...“
              </p>
              <p className="text-blood font-bold not-italic">
                Dabar tavo eilė sužinoti tiesą. Jei išdrįsi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="rezervacija" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionTitle subtitle="Pasirink savo likimą">Rezervacija</SectionTitle>
          
          <div className="bg-zinc-900/50 p-8 md:p-12 horror-border backdrop-blur-md min-h-[500px] flex flex-col">
            {/* Steps Indicator */}
            <div className="flex justify-between mb-12 max-w-md mx-auto w-full relative">
              <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -z-10" />
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-zinc-900",
                    bookingStep >= step ? "border-blood text-blood shadow-[0_0_10px_rgba(139,0,0,0.5)]" : "border-white/10 text-gray-600"
                  )}
                >
                  {bookingStep > step ? <CheckCircle2 size={20} /> : step}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {bookingStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid md:grid-cols-2 gap-12 flex-grow"
                >
                  <div className="flex justify-center">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={lt}
                      disabled={[
                        { before: new Date() },
                        (date) => fullyBookedDates.includes(format(date, 'yyyy-MM-dd'))
                      ]}
                      className="horror-calendar scale-110"
                      modifiersStyles={{
                        selected: { backgroundColor: '#8b0000', color: 'white' },
                        today: { color: '#8b0000', fontWeight: 'bold' }
                      }}
                    />
                  </div>
                  <div className="flex flex-col justify-center space-y-8">
                    <h3 className="text-2xl font-horror text-blood">1 žingsnis: Pasirinkite datą</h3>
                    <p className="text-gray-400">Pasirinkite norimą apsilankymo dieną. Tik laisvos dienos yra pasirenkamos.</p>
                    <Button 
                      disabled={!selectedDate || isLoading} 
                      onClick={() => setBookingStep(2)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : "Tęsti į laikų pasirinkimą"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {bookingStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 flex-grow"
                >
                  <div className="text-center">
                    <h3 className="text-3xl font-horror text-blood mb-2">2 žingsnis: Pasirinkite laiką</h3>
                    <p className="text-gray-400">Data: {selectedDate && format(selectedDate, 'yyyy MMMM d', { locale: lt })}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {availableTimes.map((item) => (
                      <button
                        key={item.time}
                        disabled={!item.available || isLoading}
                        onClick={() => handleTimeSelect(item.time)}
                        className={cn(
                          "p-6 border transition-all duration-300 flex flex-col items-center gap-2 group",
                          item.available 
                            ? "border-white/10 hover:border-blood hover:bg-blood/5 text-white" 
                            : "border-white/5 bg-white/5 text-gray-700 cursor-not-allowed"
                        )}
                      >
                        <Clock size={20} className={item.available ? "text-blood" : "text-gray-800"} />
                        <span className="text-xl font-bold">{item.time}</span>
                        <span className="text-[10px] uppercase tracking-widest opacity-50">
                          {item.available ? "Laisva" : "Užimta"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <button onClick={() => setBookingStep(1)} className="text-gray-500 hover:text-white transition-colors uppercase text-xs tracking-widest">
                      Grįžti atgal
                    </button>
                  </div>
                </motion.div>
              )}

              {bookingStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto w-full flex-grow"
                >
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-horror text-blood mb-2">3 žingsnis: Jūsų duomenys</h3>
                    <p className="text-gray-400">Rezervuojama: {selectedDate && format(selectedDate, 'yyyy-MM-dd')} {selectedTime}</p>
                    <p className="text-xs text-blood/60 mt-2 italic">Laikas rezervuotas 10 minučių užbaigti registracijai.</p>
                  </div>

                  <form onSubmit={handleReserve} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <User size={14} /> Vardas
                        </label>
                        <input 
                          required
                          type="text" 
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 p-4 text-white focus:border-blood outline-none transition-colors" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <User size={14} /> Pavardė
                        </label>
                        <input 
                          required
                          type="text" 
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 p-4 text-white focus:border-blood outline-none transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Mail size={14} /> El. paštas
                        </label>
                        <input 
                          required
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 p-4 text-white focus:border-blood outline-none transition-colors" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                          <Phone size={14} /> Telefonas
                        </label>
                        <input 
                          required
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-black/50 border border-white/10 p-4 text-white focus:border-blood outline-none transition-colors" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <Users size={14} /> Dalyvių skaičius
                      </label>
                      <div className="flex gap-4">
                        {[2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setParticipants(num)}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center border transition-all duration-300",
                              participants === num ? "bg-blood border-blood text-white" : "border-gray-700 text-gray-500 hover:border-blood"
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                      <div className="text-2xl font-horror text-blood">Kaina: {participants * 15}€</div>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setBookingStep(2)} className="text-gray-500 hover:text-white transition-colors uppercase text-xs tracking-widest">Atšaukti</button>
                        <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                          {isLoading ? <Loader2 className="animate-spin" /> : "Patvirtinti rezervaciją"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {bookingStep === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center space-y-8 flex-grow"
                >
                  <div className="w-24 h-24 rounded-full bg-blood/20 border-2 border-blood flex items-center justify-center text-blood animate-pulse shadow-[0_0_30px_rgba(139,0,0,0.4)]">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl font-horror text-blood">Rezervacija sėkminga!</h3>
                    <p className="text-xl text-gray-300">Lauksime jūsų Panevėžyje, Respublikos g. 58.</p>
                    <p className="text-gray-500 max-w-md mx-auto">Patvirtinimo laiškas išsiųstas jūsų nurodytu adresu. Jei turite klausimų, skambinkite +370 690 13393.</p>
                  </div>
                  <Button onClick={() => {
                    setBookingStep(1);
                    setSelectedTime(null);
                    setFormData({ firstName: '', lastName: '', email: '', phone: '' });
                  }}>
                    Grįžti į pradžią
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontaktai" className="py-32 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <SectionTitle subtitle="Kur mus rasti">Kontaktai</SectionTitle>
          
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-blood/10 border border-blood/20 text-blood">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Vieta</h3>
                  <p className="text-gray-400">Panevėžys, Respublikos g. 58<br />Lietuva</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-4 bg-blood/10 border border-blood/20 text-blood">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Telefonas</h3>
                  <p className="text-gray-400">+370 690 13393</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="p-4 bg-blood/10 border border-blood/20 text-blood">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">El. paštas</h3>
                  <p className="text-gray-400">info@siaubas666.lt</p>
                </div>
              </div>
            </div>

            <div className="h-[400px] horror-border grayscale hover:grayscale-0 transition-all duration-1000 overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2280.0123456789!2d24.357!3d55.728!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46e632123456789%3A0x123456789!2sRespublikos%20g.%2058%2C%20Panev%C4%97%C5%BEys!5e0!3m2!1slt!2slt!4v1234567890" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <div className="font-horror text-4xl text-blood blood-glow mb-6">666</div>
        
        <div className="flex justify-center gap-6 mb-8">
          <a href="https://www.facebook.com/p/666-Siaubo-Pabėgimo-Kambarys-61575980772878/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blood transition-colors">
            <Facebook size={24} />
          </a>
          <a href="https://www.instagram.com/666siaubopabegimokambarys/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blood transition-colors">
            <Instagram size={24} />
          </a>
        </div>

        <p className="text-gray-600 text-sm uppercase tracking-widest">
          © {new Date().getFullYear()} Siaubo kambarys 666. Visos teisės saugomos.
        </p>
      </footer>

      {/* Audio Element (Optional/Hidden) */}
      <audio id="bg-sound" loop>
        <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
      </audio>

      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #8b0000;
          --rdp-background-color: #1a1a1a;
          margin: 0;
          color: #9ca3af;
        }
        .rdp-day_selected {
          background-color: var(--rdp-accent-color) !important;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(139, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
