import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchMe, clearSession } from "../lib/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    const location = useLocation();
    const [status, setStatus] = useState<"checking" | "ok" | "fail">("checking");
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!token) {
            setStatus("fail");
            return;
        }

        (async () => {
            try {
                const me = await fetchMe();
                if (cancelled) return;
                setUserRole(me.user.role);
                setStatus("ok");
            } catch {
                clearSession();
                if (cancelled) return;
                setStatus("fail");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (!token) return <Navigate to="/login" replace />;

    if (status === "checking") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-slate-500 animate-pulse font-medium">Cargando aplicación...</div>
            </div>
        );
    }

    if (status === "fail") {
        return <Navigate to="/login" replace />;
    }

    // Role-based redirection for guests (USER role)
    const isAdminRoute = !location.pathname.startsWith('/m');
    if (userRole === 'USER' && isAdminRoute) {
        return <Navigate to="/m/book" replace />;
    }

    return <>{children}</>;
}
