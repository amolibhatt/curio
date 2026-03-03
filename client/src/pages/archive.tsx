import { Fact, currentUser, friendUser } from "@/lib/mock-data";
import { format, parseISO } from "date-fns";

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Fact Archive</h1>
        <p className="text-muted-foreground text-lg">Looking back at all the useless knowledge you've shared.</p>
      </header>

      <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {sortedDates.map((date) => {
          const dateFacts = groupedFacts[date];
          return (
            <div key={date} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              {/* Timeline dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-secondary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              
              {/* Content card */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-md transition-shadow">
                <div className="text-xs font-bold text-primary tracking-wider uppercase mb-4 px-2">
                  {format(parseISO(date), 'MMMM d, yyyy')}
                </div>
                
                <div className="space-y-4">
                  {dateFacts.map(fact => {
                    const isMe = fact.authorId === currentUser.id;
                    const author = isMe ? currentUser : friendUser;
                    return (
                      <div key={fact.id} className="bg-secondary/30 rounded-xl p-4 relative">
                        <div className="flex items-start gap-3">
                           <img src={author.avatar} alt={author.name} className="w-8 h-8 rounded-full" />
                           <div>
                             <p className="text-sm font-semibold mb-1">{author.name}</p>
                             <p className="text-sm text-foreground/90 leading-relaxed">"{fact.text}"</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
        
        {facts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No facts shared yet. Start the streak today!
          </div>
        )}
      </div>
    </div>
  );
}
