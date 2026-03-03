import { useState } from "react";
import { Fact, currentUser, friendUser } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, Filter } from "lucide-react";

export default function Archive({ facts }: { facts: Fact[] }) {
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Apply filters
  const filteredFacts = facts.filter(fact => {
    if (filterPerson && fact.authorId !== filterPerson) return false;
    if (filterCategory && !fact.categories.includes(filterCategory as any)) return false;
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
            className={`self-center md:self-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors ${showFilters || filterPerson || filterCategory ? 'bg-[#1C1C1C] text-white' : 'bg-white border border-black/[0.05] text-[#1C1C1C] hover:bg-black/5'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {(filterPerson || filterCategory) && '(Active)'}
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
                    onClick={() => setFilterPerson(currentUser.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === currentUser.id ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    Me
                  </button>
                  <button
                    onClick={() => setFilterPerson(friendUser.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterPerson === friendUser.id ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    {friendUser.name}
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-3 text-left">By Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterCategory(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === null ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
                  >
                    All
                  </button>
                  {['Science', 'History', 'Etymology', 'Space', 'Art', 'Us', 'Random'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === cat ? 'bg-black text-white' : 'bg-[#FBF9F6] text-[#737373] hover:bg-black/5'}`}
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

      <div className="space-y-12 px-2 md:px-0">
        {sortedDates.map((date) => {
          const dateFacts = groupedFacts[date];
          return (
            <div key={date} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#909090] uppercase whitespace-nowrap">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </h2>
                <div className="h-px bg-black/5 flex-1" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dateFacts.map((fact) => {
                  const isMe = fact.authorId === currentUser.id;
                  const author = isMe ? currentUser : friendUser;
                  const isAboutUs = fact.categories.includes('Us');
                  
                  // Blind reveal logic: if this is a friend's fact, check if I also posted on this date
                  const iPostedThisDate = dateFacts.some(f => f.authorId === currentUser.id);
                  const isHidden = !isMe && !iPostedThisDate;
                  
                  return (
                    <div 
                      key={fact.id} 
                      className={`bg-white rounded-[1.5rem] p-5 flex flex-col justify-between border transition-all ${isAboutUs ? 'border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.06)]' : 'border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.03)]'} ${isHidden ? 'bg-black/5 border-transparent shadow-none' : ''}`}
                    >
                      {isHidden ? (
                        <div className="flex flex-col items-center justify-center py-6 mb-6 text-center space-y-3">
                          <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/40">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                          </div>
                          <p className="text-sm font-serif italic text-black/40">
                            Hidden until you share your discovery for this day.
                          </p>
                        </div>
                      ) : (
                        <p className={`font-serif leading-relaxed mb-6 ${isAboutUs ? 'text-rose-950 text-lg' : 'text-[#1C1C1C] text-lg'}`}>
                          "{fact.text}"
                        </p>
                      )}

                      <div className="flex items-end justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-2 shrink-0">
                          <img src={author.avatar} alt={author.name} className={`w-5 h-5 rounded-full border border-black/5 ${isHidden ? 'opacity-50 grayscale' : ''}`} />
                          <span className={`text-[11px] font-semibold ${isHidden ? 'text-black/40' : 'text-[#1C1C1C]'}`}>{author.name}</span>
                        </div>
                        
                        {!isHidden && (
                          <div className="flex flex-wrap items-center gap-1 justify-end">
                            {fact.categories.map((category) => (
                              <div key={category} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold border ${getCategoryColor(category)}`}>
                                {category}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {facts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground font-serif italic">
            The archive awaits. Capture your first discovery today.
          </div>
        )}
      </div>
    </div>
  );
}
