import { useState } from "react";
import { Fact, currentUser, friendUser } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle, BookA, Filter } from "lucide-react";

export default function Archive({ facts }: { facts: Fact[] }) {
  const [filterPerson, setFilterPerson] = useState<string | null>(null);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
                      className={`flex flex-col md:flex-row gap-3 md:gap-6 group ${isHidden ? 'opacity-50' : ''}`}
                    >
                      <div className="flex md:flex-col items-center md:items-end gap-2 md:w-24 shrink-0 pt-1">
                        <img src={author.avatar} alt={author.name} className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-black/5 ${isHidden ? 'grayscale' : ''}`} />
                        <span className={`text-[10px] md:text-[11px] font-semibold tracking-wider uppercase ${isHidden ? 'text-black/40' : 'text-[#909090]'}`}>
                          {author.name}
                        </span>
                      </div>

                      <div className="flex-1 relative">
                        {isHidden ? (
                          <div className="py-4 md:py-6 px-5 rounded-2xl bg-black/5 text-center">
                            <p className="text-sm font-serif italic text-black/40">
                              Hidden until you share your discovery for this day.
                            </p>
                          </div>
                        ) : (
                          <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] transition-colors ${isAboutUs ? 'bg-rose-50/50 hover:bg-rose-50' : 'bg-white hover:bg-[#FAFAFA] border border-black/[0.02] shadow-sm'}`}>
                            <p className={`font-serif leading-relaxed md:leading-loose text-[1.1rem] md:text-[1.25rem] mb-4 md:mb-6 ${isAboutUs ? 'text-rose-950' : 'text-[#1C1C1C]'}`}>
                              "{fact.text}"
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-1.5">
                              {fact.categories.map((category) => (
                                <div key={category} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] md:text-[10px] uppercase tracking-widest font-bold border ${getCategoryColor(category)}`}>
                                  {getCategoryIcon(category)}
                                  {category}
                                </div>
                              ))}
                            </div>
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
