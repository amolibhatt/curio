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
    if (filterCategory && fact.category !== filterCategory) return false;
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

      <div className="space-y-10 relative before:absolute before:inset-0 before:ml-[28px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-black/5 px-2 md:px-0">
        {sortedDates.map((date) => {
          const dateFacts = groupedFacts[date];
          return (
            <div key={date} className="relative flex flex-col md:flex-row items-start justify-between md:odd:flex-row-reverse group gap-4 md:gap-0">
              
              {/* Timeline marker for Mobile (Left) and Desktop (Center) */}
              <div className="absolute left-[28px] md:left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full border-[4px] border-[#FBF9F6] bg-[#1C1C1C] z-10 top-0 md:top-6" />
              
              {/* Date Header for Mobile (Shows above the cards on mobile) */}
              <div className="md:hidden pl-[60px] w-full pt-0.5">
                <span className="text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase bg-[#FBF9F6] pr-4">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </span>
              </div>

              {/* Content side */}
              <div className="w-full pl-[60px] md:pl-0 md:w-[calc(50%-3rem)] flex flex-col gap-4 mt-2 md:mt-0">
                {/* Date Header for Desktop */}
                <div className="hidden md:flex text-[10px] font-bold tracking-[0.15em] text-[#909090] uppercase mb-2">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </div>
                
                {dateFacts.map((fact) => {
                  const isMe = fact.authorId === currentUser.id;
                  const author = isMe ? currentUser : friendUser;
                  const isAboutUs = fact.category === 'Us';
                  
                  return (
                    <div 
                      key={fact.id} 
                      className={`bg-white rounded-[1.5rem] p-5 md:p-6 border ${isAboutUs ? 'border-rose-100 shadow-[0_8px_30px_rgba(225,29,72,0.06)]' : 'border-black/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.03)]'}`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full border border-black/5" />
                          <span className="text-xs font-semibold text-[#1C1C1C]">{author.name}</span>
                        </div>
                        
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${getCategoryColor(fact.category)}`}>
                          {getCategoryIcon(fact.category)}
                          {fact.category}
                        </div>
                      </div>
                      
                      <p className={`font-serif leading-relaxed ${isAboutUs ? 'text-rose-950 text-lg md:text-xl' : 'text-[#1C1C1C] text-lg'}`}>
                        "{fact.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
              
              {/* Empty spacer for flex layout on desktop */}
              <div className="hidden md:block w-[calc(50%-3rem)]" />
            </div>
          );
        })}
        
        {facts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground font-serif italic">
            The archive awaits. Capture your first spark today.
          </div>
        )}
      </div>
    </div>
  );
}
