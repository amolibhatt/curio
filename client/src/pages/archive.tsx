import { Fact, currentUser, friendUser } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";
import { Heart, Microscope, Telescope, Palette, Globe, HelpCircle } from "lucide-react";

export default function Archive({ facts }: { facts: Fact[] }) {
  // Group facts by date
  const groupedFacts = facts.reduce((acc, fact) => {
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
      case 'Science': return <Microscope className="w-3.5 h-3.5" />;
      case 'History': return <Globe className="w-3.5 h-3.5" />;
      case 'Space': return <Telescope className="w-3.5 h-3.5" />;
      case 'Art': return <Palette className="w-3.5 h-3.5" />;
      case 'About Us': return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />;
      default: return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    if (category === 'About Us') return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-[#FBF9F6] text-[#737373] border-black/5';
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-2xl mx-auto py-6 md:py-10">
      <header className="mb-12 text-center md:text-left px-4 md:px-0">
        <h1 className="text-[2.5rem] md:text-[3.5rem] font-serif text-[#1C1C1C] tracking-tight leading-tight">
          The Archive
        </h1>
        <p className="text-base text-[#909090] italic font-serif mt-2">
          A timeline of our shared curiosity.
        </p>
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
                  const isAboutUs = fact.category === 'About Us';
                  
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
            The archive is empty. Start your first streak today.
          </div>
        )}
      </div>
    </div>
  );
}
