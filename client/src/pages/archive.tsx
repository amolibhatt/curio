import { useState } from "react";
import { Fact, User } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, Filter, Sparkles, Brain, X } from "lucide-react";
import emptyArchiveImg from "../assets/images/empty-archive.png";
import { motion, AnimatePresence } from "framer-motion";

export default function Archive({ facts, onReact, activeUser, partnerUser }: { facts: Fact[], onReact: (factId: string, reaction: 'mind-blown' | 'fascinating' | null) => void, activeUser: User, partnerUser: User }) {
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [burstReaction, setBurstReaction] = useState<{id: string, type: string} | null>(null);

  // Apply filters
  const filteredFacts = facts.filter(fact => {
    if (filterPerson && fact.authorId !== filterPerson) return false;
    if (filterCategories.length > 0 && !fact.categories.some(c => filterCategories.includes(c))) return false;
    return true;
  });

  // Group facts by date
  const groupedFacts = filteredFacts.reduce((acc, fact) => {
    if (!acc[fact.date]) {
      acc[fact.date] = [];
    }
    acc[fact.date].push(fact);
    return acc;
  }, {} as Record<string, Fact[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedFacts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'History': return <Globe className="w-3.5 h-3.5" />;
      case 'Etymology': return <BookA className="w-3.5 h-3.5" />;
      case 'Science': return <Microscope className="w-3.5 h-3.5" />;
      case 'Space': return <Telescope className="w-3.5 h-3.5" />;
      case 'Art': return <Palette className="w-3.5 h-3.5" />;
      case 'Us': return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      default: return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    if (category === 'Us') return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-[#FBF9F6] text-[#737373] border-black/5';
  };

  const handleReact = (factId: string, type: 'mind-blown' | 'fascinating' | 'heart' | 'laugh' | 'thinking' | 'sad') => {
    if (navigator.vibrate) navigator.vibrate(50);
    setBurstReaction({ id: factId, type });
    onReact(factId, type);
    
    // Clear burst after animation
    setTimeout(() => {
      setBurstReaction(null);
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10">
      <header className="mb-8 md:mb-12 text-center md:text-left px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[2.5rem] md:text-[3.5rem] font-serif text-[#1C1C1C] tracking-tight leading-tight">
              The Archive
            </h1>
            <p className="text-base text-[#909090] italic font-serif mt-2">
              A living timeline of the things that made us think.
            </p>
          </div>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`self-center md:self-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors ${showFilters || filterPerson || filterCategories.length > 0 ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-black/[0.05] text-[#1C1C1C] hover:bg-black/5'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {(filterPerson || filterCategories.length > 0) && '(Active)'}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-6 p-5 bg-white rounded-[1.5rem] border border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-5">
              {/* Person Filter */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-3 text-left">By Person</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterPerson(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === null ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    Everyone
                  </button>
                  <button
                    onClick={() => setFilterPerson(activeUser.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === activeUser.id ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    Me
                  </button>
                  <button
                    onClick={() => setFilterPerson(partnerUser.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === partnerUser.id ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    {partnerUser.name}
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-3 text-left">By Category (Select multiple)</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCategories([])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.length === 0 ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    All Categories
                  </button>
                  {['Science', 'History', 'Etymology', 'Space', 'Art', 'Us', 'Random'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setFilterCategories(prev => 
                          prev.includes(cat) 
                            ? prev.filter(c => c !== cat) 
                            : [...prev, cat]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategories.includes(cat) ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="space-y-8 md:space-y-12 px-4 md:px-0">
        {sortedDates.map((date) => {
          const dateFacts = groupedFacts[date];
          return (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
              <div className="sticky top-[88px] md:top-[104px] z-10 bg-[#FBF9F6]/95 backdrop-blur-md py-2 md:py-3 mb-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-black/5 md:border-none">
                <h2 className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-[#909090] uppercase">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </h2>
              </div>
              
              <div className="space-y-6 md:space-y-8">
                {dateFacts.map((fact, index) => {
                  const isMe = fact.authorId === activeUser.id;
                  const author = isMe ? activeUser : partnerUser;
                  const isAboutUs = fact.categories.includes('Us');
                  
                  // Blind reveal logic: if this is a friend's fact, check if I also posted on this date
                  const iPostedThisDate = dateFacts.some(f => f.authorId === activeUser.id);
                  const isHidden = !isMe && !iPostedThisDate;
                  
                  // Check if current user has reacted
                  const myReaction = fact.reactions?.[activeUser.id];
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 + 0.1 }}
                      key={fact.id} 
                      className={`flex flex-col md:flex-row gap-3 md:gap-6 group ${isHidden ? 'opacity-50' : ''}`}
                    >
                      <div className="flex md:flex-col items-center md:items-end gap-2 md:w-24 shrink-0 pt-1 relative">
                        <div className="relative z-10 bg-[#FBF9F6] p-1 rounded-full">
                          <img src={author.avatar} alt={author.name} className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-black/5 ${isHidden ? 'grayscale' : 'shadow-sm z-10'}`} />
                        </div>
                        <span className={`text-[10px] md:text-[11px] font-semibold tracking-wider uppercase bg-[#FBF9F6] relative z-10 ${isHidden ? 'text-black/40' : 'text-[#909090]'}`}>
                          {author.name}
                        </span>
                        {/* Connecting glowing line for timeline */}
                        {!isHidden && (
                          <div className="hidden md:block absolute top-10 bottom-[-32px] right-[21px] w-[2px] z-0">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/10 via-[#1C1C1C]/5 to-transparent"></div>
                            {myReaction && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></div>}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 relative group/card perspective-1000">
                        {isHidden ? (
                          <div className="py-4 md:py-6 px-5 rounded-2xl bg-black/[0.03] text-center relative overflow-hidden transition-all duration-700 hover:bg-black/[0.05] animate-breathe">
                            <div className="absolute inset-0 backdrop-blur-sm z-0"></div>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
                            <p className="text-sm font-serif italic text-black/50 relative z-10 flex items-center justify-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-black/20 animate-ping" style={{ animationDuration: '1.5s' }}></span>
                              Hidden until you share today's discovery
                              <span className="w-1.5 h-1.5 rounded-full bg-black/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }}></span>
                            </p>
                          </div>
                        ) : (
                          <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] transition-all duration-500 relative overflow-hidden group-hover/card:shadow-elevated transform-gpu ${isAboutUs ? 'bg-rose-50/50 hover:bg-rose-50' : 'bg-white hover:bg-[#FAFAFA] border border-black/[0.02] shadow-[0_4px_20px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.01)] hover:-translate-y-1'}`}>
                            {/* Subtle category-based tint with gradient */}
                            {!isAboutUs && fact.categories.includes('Space') && <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent pointer-events-none" />}
                            {!isAboutUs && fact.categories.includes('Science') && <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent pointer-events-none" />}
                            {!isAboutUs && fact.categories.includes('Art') && <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 to-transparent pointer-events-none" />}
                            {!isAboutUs && fact.categories.includes('History') && <div className="absolute inset-0 bg-gradient-to-br from-stone-50/40 to-transparent pointer-events-none" />}
                            
                            {/* Texture overlay for cards */}
                            <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
                            
                            <div className="relative z-10">
                                {fact.imageUrl && (
                                  <div className="mb-4 md:mb-6 rounded-xl overflow-hidden border border-black/5 shadow-soft cursor-pointer group/image" onClick={() => setSelectedImage(fact.imageUrl!)}>
                                    <div className="relative">
                                      <img src={fact.imageUrl} alt="Discovery" className="w-full h-auto object-cover max-h-[400px] transition-transform duration-700 group-hover/image:scale-105" />
                                      <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur-sm text-black px-4 py-2 rounded-full text-xs font-bold tracking-wider opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover/image:translate-y-0 shadow-lg">
                                          EXPAND
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              <p className={`font-serif leading-relaxed md:leading-loose text-[1.1rem] md:text-[1.25rem] mb-4 md:mb-6 ${isAboutUs ? 'text-rose-950' : 'text-[#1C1C1C]'}`}>
                                "{fact.text}"
                              </p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {fact.categories.map((category) => (
                                  <div key={category} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest font-bold border ${getCategoryColor(category)}`}>
                                    {getCategoryIcon(category)}
                                    {category}
                                  </div>
                                ))}
                              </div>
                              
                                <div className="flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity md:ml-auto">
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'mind-blown')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 ${
                                        myReaction === 'mind-blown' 
                                          ? 'bg-[#1C1C1C] text-white shadow-soft' 
                                          : 'bg-white border border-black/10 text-[#909090] hover:text-black hover:border-black/20 hover:shadow-soft'
                                      }`}
                                    >
                                      <Brain className="w-3.5 h-3.5" />
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'mind-blown' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                        >
                                          <Brain className="w-6 h-6 text-[#1C1C1C]" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'fascinating')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 ${
                                        myReaction === 'fascinating' 
                                          ? 'bg-[#1C1C1C] text-white shadow-soft' 
                                          : 'bg-white border border-black/10 text-[#909090] hover:text-black hover:border-black/20 hover:shadow-soft'
                                      }`}
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'fascinating' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                        >
                                          <Sparkles className="w-6 h-6 text-amber-400" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'heart')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all active:scale-95 ${
                                        myReaction === 'heart' 
                                          ? 'bg-rose-500 text-white shadow-soft border-rose-500' 
                                          : 'bg-white border border-black/10 text-[#909090] hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:shadow-soft'
                                      }`}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${myReaction === 'heart' ? 'fill-white' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'heart' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                        >
                                          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'laugh')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] transition-all active:scale-95 ${
                                        myReaction === 'laugh' 
                                          ? 'bg-amber-100 border-amber-200 shadow-soft' 
                                          : 'bg-white border border-black/10 hover:border-amber-200 hover:bg-amber-50 hover:shadow-soft grayscale hover:grayscale-0'
                                      }`}
                                    >
                                      😂
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'laugh' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none text-2xl"
                                        >
                                          😂
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'thinking')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] transition-all active:scale-95 ${
                                        myReaction === 'thinking' 
                                          ? 'bg-blue-100 border-blue-200 shadow-soft' 
                                          : 'bg-white border border-black/10 hover:border-blue-200 hover:bg-blue-50 hover:shadow-soft grayscale hover:grayscale-0'
                                      }`}
                                    >
                                      🤔
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'thinking' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none text-2xl"
                                        >
                                          🤔
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => handleReact(fact.id, 'sad')}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[14px] transition-all active:scale-95 ${
                                        myReaction === 'sad' 
                                          ? 'bg-indigo-100 border-indigo-200 shadow-soft' 
                                          : 'bg-white border border-black/10 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-soft grayscale hover:grayscale-0'
                                      }`}
                                    >
                                      😢
                                    </button>
                                    <AnimatePresence>
                                      {burstReaction?.id === fact.id && burstReaction?.type === 'sad' && (
                                        <motion.div 
                                          initial={{ opacity: 1, y: 0, scale: 1 }}
                                          animate={{ opacity: 0, y: -40, scale: 1.5 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ duration: 0.8, ease: "easeOut" }}
                                          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none text-2xl"
                                        >
                                          😢
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              
                              {/* Display existing reactions if any */}
                              {(fact.reactions?.[partnerUser.id]) && isMe && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAFAFA] border border-black/[0.03] text-[#737373] text-[10px] font-bold tracking-widest uppercase md:ml-auto animate-in zoom-in-95 duration-300 shadow-soft">
                                  {fact.reactions[partnerUser.id] === 'mind-blown' && <Brain className="w-3.5 h-3.5" />}
                                  {fact.reactions[partnerUser.id] === 'fascinating' && <Sparkles className="w-3.5 h-3.5" />}
                                  {fact.reactions[partnerUser.id] === 'heart' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
                                  {fact.reactions[partnerUser.id] === 'laugh' && <span className="text-[12px]">😂</span>}
                                  {fact.reactions[partnerUser.id] === 'thinking' && <span className="text-[12px]">🤔</span>}
                                  {fact.reactions[partnerUser.id] === 'sad' && <span className="text-[12px]">😢</span>}
                                  <span>{partnerUser.name} reacted</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {facts.length === 0 && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in duration-1000 delay-300 relative min-h-[50vh] flex flex-col justify-center items-center">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FBF9F6]/90 to-[#FBF9F6] z-10 pointer-events-none" />
            
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-sm">
              <div className="w-48 h-48 mb-4 relative animate-float-slow">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-100/50 via-transparent to-transparent blur-xl"></div>
                <img src={emptyArchiveImg} alt="Empty Archive" className="w-full h-full object-contain relative z-10 opacity-90 drop-shadow-2xl mix-blend-multiply" />
              </div>
              
              <h3 className="font-serif text-2xl md:text-3xl text-[#1C1C1C] mb-3">The Archive Awaits</h3>
              <p className="text-[#909090] text-sm md:text-base leading-relaxed">
                Your shared cabinet is empty. Capture your first discovery to begin the collection.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Full-screen Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={selectedImage} 
              alt="Expanded Discovery" 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
