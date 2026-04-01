import { useStore } from "@/lib/store";
import { X, Info, AlertTriangle, AlertOctagon } from "lucide-react";
import { useState, useEffect } from "react";

export function AnnouncementBar() {
    const { settings } = useStore();
    const [isVisible, setIsVisible] = useState(true);

    // If settings not loaded or disabled, don't show
    if (!settings?.announcementEnabled || !settings?.announcementText) {
        return null;
    }

    if (!isVisible) return null;

    const type = settings.announcementType || "info";

    const getColors = () => {
        switch (type) {
            case "warning":
                return "bg-amber-500 text-white";
            case "critical":
                return "bg-red-600 text-white";
            case "success":
                return "bg-green-600 text-white";
            default:
                return "bg-indigo-600 text-white";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="h-4 w-4" />;
            case "critical":
                return <AlertOctagon className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    return (
        <div className={`${getColors()} px-4 py-2 text-sm font-medium relative z-50 flex items-center justify-between shadow-md animate-in slide-in-from-top-full duration-300`}>
            <div className="container mx-auto max-w-7xl px-4 md:px-6 flex items-center justify-center gap-2 text-center">
                {getIcon()}
                <span>{settings.announcementText}</span>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="absolute right-2 md:right-4 p-1 hover:bg-black/10 rounded-full transition-colors"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
