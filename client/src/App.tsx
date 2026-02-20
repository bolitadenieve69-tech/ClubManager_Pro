import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pistas from './pages/Pistas';
import Tarifas from './pages/Tarifas';
import Reservas from './pages/Reservas';
import Facturas from './pages/Facturas';
import FacturacionClientes from './pages/FacturacionClientes';
import Cierres from './pages/Cierres';
import KpisOperativos from './pages/KpisOperativos';
import InsightsOperativos from './pages/InsightsOperativos';
import Reportes from './pages/Reportes';
import Movimientos from './pages/Movimientos';
import Americano from './pages/Americano';
import HorarioDiario from './pages/HorarioDiario';
import Gastos from './pages/Gastos';
import Contabilidad from './pages/Contabilidad';
import MobileAcceptInvite from './pages/MobileAcceptInvite';
import MobileHome from './pages/MobileHome';
import MobileBook from './pages/MobileBook';
import MobileBookingDetail from './pages/MobileBookingDetail';
import Members from './pages/Members';
import Configuracion from './pages/Configuracion';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/courts"
                    element={
                        <ProtectedRoute>
                            <Pistas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rates"
                    element={
                        <ProtectedRoute>
                            <Tarifas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reservations"
                    element={
                        <ProtectedRoute>
                            <Reservas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/schedule"
                    element={
                        <ProtectedRoute>
                            <HorarioDiario />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/expenses"
                    element={
                        <ProtectedRoute>
                            <Gastos />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/accounting"
                    element={
                        <ProtectedRoute>
                            <Contabilidad />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/invoices"
                    element={
                        <ProtectedRoute>
                            <Facturas />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/billing"
                    element={
                        <ProtectedRoute>
                            <FacturacionClientes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <KpisOperativos />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/insights"
                    element={
                        <ProtectedRoute>
                            <InsightsOperativos />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <Reportes />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/closeouts"
                    element={
                        <ProtectedRoute>
                            <Cierres />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/movements"
                    element={
                        <ProtectedRoute>
                            <Movimientos />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tournaments"
                    element={
                        <ProtectedRoute>
                            <Americano />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/members"
                    element={
                        <ProtectedRoute>
                            <Members />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Configuracion />
                        </ProtectedRoute>
                    }
                />

                {/* Rutas Móviles (PWA) */}
                <Route path="/join/:token" element={<MobileAcceptInvite />} />
                <Route path="/m/accept/:token" element={<MobileAcceptInvite />} />
                <Route
                    path="/m"
                    element={
                        <ProtectedRoute>
                            <MobileHome />
                        </ProtectedRoute>
                    }
                />
                <Route path="/app/reservar" element={<ProtectedRoute><MobileBook /></ProtectedRoute>} />
                <Route path="/reservas/nueva" element={<ProtectedRoute><MobileBook /></ProtectedRoute>} />
                <Route
                    path="/m/book"
                    element={
                        <ProtectedRoute>
                            <MobileBook />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/m/booking/:id"
                    element={
                        <ProtectedRoute>
                            <MobileBookingDetail />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
