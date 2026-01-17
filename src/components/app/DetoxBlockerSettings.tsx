import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Smartphone,
  Eye,
  Layers,
  AlertTriangle,
  Check,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppBlocker } from '@/hooks/useAppBlocker';
import { cn } from '@/lib/utils';

interface DetoxBlockerSettingsProps {
  onBlockingConfigured?: (apps: string[]) => void;
  selectedApps?: string[];
  onAppsChange?: (apps: string[]) => void;
}

export function DetoxBlockerSettings({ 
  onBlockingConfigured,
  selectedApps = [],
  onAppsChange 
}: DetoxBlockerSettingsProps) {
  const {
    isNative,
    hasUsagePermission,
    hasOverlayPermission,
    socialApps,
    usageStats,
    isLoading,
    requestUsagePermission,
    requestOverlayPermission,
  } = useAppBlocker();

  const [monitoringEnabled, setMonitoringEnabled] = useState(false);
  const [blockingEnabled, setBlockingEnabled] = useState(false);

  const handleAppToggle = (packageName: string) => {
    const newSelection = selectedApps.includes(packageName)
      ? selectedApps.filter(p => p !== packageName)
      : [...selectedApps, packageName];
    onAppsChange?.(newSelection);
  };

  const allPermissionsGranted = hasUsagePermission && hasOverlayPermission;

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isNative) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            App Blocking
          </CardTitle>
          <CardDescription>
            Disponibile solo su Android
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Il blocco delle app è disponibile solo su Android. Su iOS, usa il Focus Mode di sistema per limitare le app durante il detox.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permissions Card */}
      <Card className="bg-card/50 border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Permessi Richiesti
          </CardTitle>
          <CardDescription>
            Abilita i permessi per monitorare e bloccare le app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Usage Access Permission */}
          <div 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors",
              hasUsagePermission 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-muted/30 border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                hasUsagePermission ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <Eye className={cn(
                  "h-4 w-4",
                  hasUsagePermission ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">Accesso Utilizzo App</p>
                <p className="text-xs text-muted-foreground">
                  Monitora il tempo di utilizzo delle app
                </p>
              </div>
            </div>
            {hasUsagePermission ? (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
                <Check className="h-3 w-3 mr-1" />
                Attivo
              </Badge>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={requestUsagePermission}
                className="gap-1"
              >
                Abilita
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Overlay Permission */}
          <div 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-colors",
              hasOverlayPermission 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-muted/30 border-border/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                hasOverlayPermission ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <Layers className={cn(
                  "h-4 w-4",
                  hasOverlayPermission ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">Visualizzazione Sopra App</p>
                <p className="text-xs text-muted-foreground">
                  Mostra schermata di blocco sopra le app
                </p>
              </div>
            </div>
            {hasOverlayPermission ? (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
                <Check className="h-3 w-3 mr-1" />
                Attivo
              </Badge>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                onClick={requestOverlayPermission}
                className="gap-1"
              >
                Abilita
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring & Blocking Toggle */}
      <AnimatePresence>
        {allPermissionsGranted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-card/50 border-border/30">
              <CardContent className="pt-4 space-y-4">
                {/* Monitoring Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Monitoraggio Utilizzo</p>
                      <p className="text-xs text-muted-foreground">
                        Traccia sempre il tempo sui social
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={monitoringEnabled}
                    onCheckedChange={setMonitoringEnabled}
                  />
                </div>

                {/* Blocking Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">Blocco Durante Detox</p>
                      <p className="text-xs text-muted-foreground">
                        Blocca le app durante le challenge
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={blockingEnabled}
                    onCheckedChange={(checked) => {
                      setBlockingEnabled(checked);
                      if (checked && selectedApps.length > 0) {
                        onBlockingConfigured?.(selectedApps);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* App Selection */}
      <AnimatePresence>
        {allPermissionsGranted && blockingEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-card/50 border-border/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  App da Bloccare
                </CardTitle>
                <CardDescription>
                  Seleziona le app da bloccare durante il detox
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {socialApps.map((app) => {
                    const usage = usageStats.find(s => s.packageName === app.packageName);
                    const isSelected = selectedApps.includes(app.packageName);
                    
                    return (
                      <div
                        key={app.packageName}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-muted/20 border-border/30 hover:bg-muted/40"
                        )}
                        onClick={() => handleAppToggle(app.packageName)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleAppToggle(app.packageName)}
                          />
                          <div>
                            <p className="text-sm font-medium">{app.appName}</p>
                            {usage && (
                              <p className="text-xs text-muted-foreground">
                                Oggi: {usage.usageMinutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedApps.length > 0 && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-emerald-500 font-medium">
                      {selectedApps.length} app verranno bloccate durante le challenge detox
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
