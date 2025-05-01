/* eslint-disable @typescript-eslint/no-unused-vars */
// StoicApp.tsx with hydration fix
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, BookOpen, Save, ArrowRight, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";

const exercises = [
  { day: "Hari 1", title: "Dikotomi Kendali", prompt: "Tuliskan dua kolom: 'Kendali saya' dan 'Di luar kendali saya'. Lalu evaluasi satu kejadian hari ini." },
  { day: "Hari 2", title: "Premeditatio Malorum", prompt: "Apa hal buruk yang bisa terjadi hari ini? Bagaimana kamu akan merespons secara rasional dan tenang?" },
  { day: "Hari 3", title: "Memento Mori", prompt: "Jika ini harimu yang terakhir, apa hal baik dan bermakna yang ingin kamu lakukan hari ini?" },
  { day: "Hari 4", title: "Latihan Kesabaran", prompt: "Tuliskan situasi menjengkelkan hari ini dan bagaimana kamu melatih kesabaran." },
  { day: "Hari 5", title: "Refleksi Kebajikan", prompt: "Tuliskan tindakanmu hari ini dan nilai apakah itu bijaksana, adil, berani, dan terkendali." },
  { day: "Hari 6", title: "Amor Fati", prompt: "Ceritakan peristiwa mengecewakan hari ini dan pelajaran positif yang bisa diambil." },
  { day: "Hari 7", title: "Evaluasi Diri", prompt: "Tuliskan 3 hal yang kamu lakukan dengan baik, 3 hal yang bisa ditingkatkan, dan niat minggu depan." }
];

interface DailyReflection {
  date: string;
  day: number;
  title: string;
  prompt: string;
  reflection: string;
}

interface WeeklyArchive {
  startDate: string;
  endDate: string;
  reflections: DailyReflection[];
}

interface ExpandedReflections {
  [key: string]: boolean;
}

export default function StoicApp() {
  const { theme, setTheme } = useTheme();
  const [dayIndex, setDayIndex] = useState(0);
  const [reflection, setReflection] = useState("");
  const [archive, setArchive] = useState<WeeklyArchive[]>([]);
  const [currentReflections, setCurrentReflections] = useState<DailyReflection[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [expandedReflections, setExpandedReflections] = useState<ExpandedReflections>({});
  const [mounted, setMounted] = useState(false);
  const exercise = exercises[dayIndex];

  // Mark when component has mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Skip localStorage operations during SSR
    if (!mounted) return;
    
    // Tangani loading data dari localStorage
    try {
      const savedIndex = localStorage.getItem("stoic_dayIndex");
      const savedReflection = localStorage.getItem("stoic_reflection");
      const savedArchive = localStorage.getItem("stoic_archive");
      const savedCurrentReflections = localStorage.getItem("stoic_currentReflections");
      
      if (savedIndex) setDayIndex(Number(savedIndex));
      if (savedReflection) setReflection(savedReflection);
      if (savedArchive) {
        const parsedArchive = JSON.parse(savedArchive);
        // Validasi data
        if (Array.isArray(parsedArchive)) {
          setArchive(parsedArchive);
        }
      }
      if (savedCurrentReflections) {
        const parsedReflections = JSON.parse(savedCurrentReflections);
        // Validasi data
        if (Array.isArray(parsedReflections)) {
          setCurrentReflections(parsedReflections);
        }
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Reset data jika terjadi error
      localStorage.removeItem("stoic_archive");
      localStorage.removeItem("stoic_currentReflections");
    }
  }, [mounted]);

  useEffect(() => {
    // Skip localStorage operations during SSR
    if (!mounted) return;
    
    // Simpan data ke localStorage
    try {
      localStorage.setItem("stoic_dayIndex", dayIndex.toString());
      localStorage.setItem("stoic_reflection", reflection);
      localStorage.setItem("stoic_archive", JSON.stringify(archive));
      localStorage.setItem("stoic_currentReflections", JSON.stringify(currentReflections));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
      toast.error("Gagal menyimpan data");
    }
  }, [dayIndex, reflection, archive, currentReflections, mounted]);

  const saveReflection = () => {
    if (!reflection.trim()) {
      toast.error("Refleksi tidak boleh kosong");
      return false;
    }

    const newReflection: DailyReflection = {
      date: new Date().toISOString(),
      day: dayIndex,
      title: exercise.title,
      prompt: exercise.prompt,
      reflection: reflection
    };

    // Check if we already have a reflection for this day
    const existingIndex = currentReflections.findIndex(r => r.day === dayIndex);
    
    if (existingIndex !== -1) {
      // Update existing reflection
      const updatedReflections = [...currentReflections];
      updatedReflections[existingIndex] = newReflection;
      setCurrentReflections(updatedReflections);
    } else {
      // Add new reflection
      setCurrentReflections([...currentReflections, newReflection]);
    }

    toast.success("Refleksi tersimpan!");
    return true;
  };

  const nextDay = () => {
    if (!reflection.trim()) {
      toast.error("Refleksi tidak boleh kosong");
      return;
    }
    
    const saved = saveReflection();
    if (!saved) return;
    
    if (dayIndex < exercises.length - 1) {
      setDayIndex(dayIndex + 1);
      
      // Check if we have an existing reflection for the next day
      const nextReflection = currentReflections.find(r => r.day === dayIndex + 1);
      setReflection(nextReflection?.reflection || "");
    }
  };

  const completeWeek = () => {
    if (!reflection.trim()) {
      toast.error("Refleksi tidak boleh kosong");
      return;
    }
    
    const saved = saveReflection();
    if (!saved) return;
    
    if (currentReflections.length === 0) {
      toast.error("Tidak ada refleksi untuk disimpan");
      return;
    }

    // Sort reflections by day
    const sortedReflections = [...currentReflections].sort((a, b) => a.day - b.day);
    
    // Create a new weekly archive entry
    const startDate = new Date(sortedReflections[0].date);
    const endDate = new Date();
    
    const newWeeklyArchive: WeeklyArchive = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reflections: sortedReflections
    };

    // Add to archive
    setArchive([...archive, newWeeklyArchive]);
    
    // Reset for new week
    setDayIndex(0);
    setReflection("");
    setCurrentReflections([]);
    
    toast.success("Minggu refleksi selesai dan tersimpan!");
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  const toggleArchiveView = () => {
    setIsArchiveOpen(!isArchiveOpen);
  };

  const changeDay = (newDayIndex: number) => {
    if (reflection.trim()) {
      saveReflection();
    }
    
    setDayIndex(newDayIndex);
    
    // Load reflection for the selected day if it exists
    const dayReflection = currentReflections.find(r => r.day === newDayIndex);
    setReflection(dayReflection?.reflection || "");
  };

  const getDayTitle = (dayNum: number) => {
    if (dayNum >= 0 && dayNum < exercises.length) {
      return exercises[dayNum].day + ": " + exercises[dayNum].title;
    }
    return `Hari ${dayNum + 1}`;
  };

  const toggleReflectionExpand = (weekIdx: number, refIdx: number) => {
    const key = `${weekIdx}-${refIdx}`;
    setExpandedReflections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isReflectionExpanded = (weekIdx: number, refIdx: number) => {
    const key = `${weekIdx}-${refIdx}`;
    return !!expandedReflections[key];
  };

  // Only show the UI when mounted (client-side)
  if (!mounted) {
    return null; // Return empty during SSR to avoid hydration mismatch
  }

  const isDarkMode = theme === 'dark';

  return (
    <div className="min-h-screen transition-colors duration-300">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold">Jurnal Stoik Harian</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
              className="rounded-full"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleArchiveView}
              className={cn("rounded-full", isArchiveOpen && "bg-primary text-primary-foreground")}
            >
              <BookOpen size={18} />
            </Button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!isArchiveOpen ? (
            <motion.div
              key="main-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="rounded-xl shadow-lg border-2 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-wrap md:flex-nowrap">
                    {/* Sidebar navigation */}
                    <div className="w-full md:w-1/4 border-r dark:border-gray-700 p-4 space-y-2">
                      {exercises.map((ex, idx) => (
                        <Button
                          key={idx}
                          variant={dayIndex === idx ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-left",
                            dayIndex === idx ? "bg-primary text-primary-foreground" : "",
                            currentReflections.some(r => r.day === idx) ? "font-medium" : ""
                          )}
                          onClick={() => changeDay(idx)}
                        >
                          <div className="flex items-center">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs",
                              dayIndex === idx 
                                ? "bg-primary-foreground text-primary" 
                                : isDarkMode 
                                  ? "bg-gray-700" 
                                  : "bg-gray-200"
                            )}>
                              {idx + 1}
                            </div>
                            <span className="truncate">{ex.title}</span>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {/* Main content */}
                    <div className="w-full md:w-3/4 p-6 space-y-4">
                      <motion.div
                        key={`exercise-${dayIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="text-2xl font-bold mb-1">{exercise.day}: {exercise.title}</h2>
                        <p className="text-lg mb-4 text-muted-foreground">{exercise.prompt}</p>
                        
                        <Textarea
                          className="min-h-48 text-lg"
                          placeholder="Tulis refleksimu di sini..."
                          value={reflection}
                          onChange={(e) => setReflection(e.target.value)}
                        />
                        
                        <div className="flex gap-3 mt-4">
                          <Button 
                            onClick={saveReflection}
                            className="flex items-center gap-2"
                          >
                            <Save size={16} />
                            Simpan
                          </Button>
                          
                          {dayIndex < exercises.length - 1 ? (
                            <Button 
                              onClick={nextDay}
                              className="flex items-center gap-2"
                              variant="outline"
                            >
                              Lanjut
                              <ArrowRight size={16} />
                            </Button>
                          ) : (
                            <Button 
                              onClick={completeWeek} 
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <RotateCcw size={16} />
                              Selesaikan Minggu
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Progress indicator */}
              <div className="mt-6 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(currentReflections.length / 7) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {currentReflections.length}/7
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="archive-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="rounded-xl shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Arsip Refleksi</h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleArchiveView}
                    >
                      Kembali
                    </Button>
                  </div>
                  
                  {archive.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Belum ada refleksi yang diarsipkan.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {archive.map((weekEntry, weekIdx) => (
                        <motion.div 
                          key={weekIdx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: weekIdx * 0.1 }}
                          className="border dark:border-gray-700 rounded-lg p-4"
                        >
                          <h3 className="text-xl font-semibold mb-2">
                            Minggu {weekIdx + 1}: {formatDate(weekEntry.startDate)} - {formatDate(weekEntry.endDate)}
                          </h3>
                          
                          <div className="space-y-4 mt-4">
                            {weekEntry.reflections.map((reflection, refIdx) => (
                              <div 
                                key={refIdx} 
                                className="border-l-4 border-primary pl-4 py-1"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">
                                    {reflection.day >= 0 && reflection.day < exercises.length
                                      ? `${exercises[reflection.day].day}: ${reflection.title}`
                                      : `Hari ${reflection.day + 1}: ${reflection.title}`
                                    }
                                  </h4>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => toggleReflectionExpand(weekIdx, refIdx)}
                                  >
                                    {isReflectionExpanded(weekIdx, refIdx) ? 
                                      <ChevronUp size={16} /> : 
                                      <ChevronDown size={16} />
                                    }
                                  </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{reflection.prompt}</p>
                                <div 
                                  className={cn(
                                    "mt-2 transition-all duration-300 overflow-hidden",
                                    isReflectionExpanded(weekIdx, refIdx) ? "max-h-96" : "max-h-20"
                                  )}
                                >
                                  <div className="whitespace-pre-wrap pr-4">
                                    {reflection.reflection}
                                  </div>
                                </div>
                                {!isReflectionExpanded(weekIdx, refIdx) && reflection.reflection.length > 100 && (
                                  <div className="text-center mt-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs text-muted-foreground hover:text-foreground"
                                      onClick={() => toggleReflectionExpand(weekIdx, refIdx)}
                                    >
                                      Baca selengkapnya...
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}