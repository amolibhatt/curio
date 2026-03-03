import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, Link as LinkIcon } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (userType: 'me' | 'friend') => void }) {
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLink = () => {
    const link = `${window.location.origin}/invite?code=12345`;
    setInviteLink(link);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="w-full max-w-md space-y-8 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">DailyFact</h1>
          <p className="text-muted-foreground text-lg">Exchange one interesting fact a day with your best friend.</p>
        </div>

        <Card className="border-border/50 shadow-float rounded-3xl overflow-hidden">
          <CardHeader className="bg-secondary/30 pb-8 border-b border-border/50">
            <CardTitle className="text-2xl">Sign In Demo</CardTitle>
            <CardDescription className="text-base">Choose who you want to experience the app as.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <Button 
              className="w-full h-14 text-lg rounded-xl justify-between px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => onLogin('me')}
            >
              Sign in as You
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-bold">Or simulate invite</span>
              </div>
            </div>

            <Button 
              variant="outline"
              className="w-full h-14 text-lg rounded-xl justify-between px-6 border-2"
              onClick={() => onLogin('friend')}
            >
              Sign in as Friend (Alex)
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* Simulated Invite Flow */}
            <div className="pt-4 space-y-3">
              <p className="text-sm font-medium text-center text-muted-foreground">Want to invite someone?</p>
              {!inviteLink ? (
                <Button variant="secondary" className="w-full rounded-xl" onClick={generateLink}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Generate Invite Link
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input readValue value={inviteLink} readOnly className="rounded-xl bg-secondary/50 font-mono text-xs" />
                  <Button variant={copied ? "default" : "secondary"} className="rounded-xl shrink-0" onClick={copyLink}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
