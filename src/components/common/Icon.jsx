import { Activity, AlertCircle, AlertTriangle, Archive, ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, Boxes, Briefcase, Building2, Calculator, Camera, Car, Check, CheckCircle, CheckSquare, ClipboardCheck, ClipboardList, Clock, CreditCard, DollarSign, FileBarChart, FileCheck, FileSearch, FileText, Files, Flag, FolderOpen, GitCommit, Globe, HelpCircle, History, Inbox, Info, Landmark, LayoutDashboard, ListChecks, Loader2, Lock, LogOut, Mail, Map, MapPin, Menu, Moon, PenTool, PieChart, RefreshCw, Route, Save, Search, Settings, Shield, ShieldAlert, ShieldCheck, Ship, Star, Sun, Target, Timer, Trash2, TrendingUp, Truck, Users, Warehouse, X, Zap } from 'lucide-react';

// Antes los íconos venían de data-lucide="nombre-kebab" + el script CDN de
// unpkg (lucide.createIcons()). Ahora usamos el paquete lucide-react
// (deuda técnica #2 de AGENTS.md resuelta: los íconos quedan empaquetados
// en el build en vez de depender de un CDN externo).
//
// Se importan solo los íconos que la app realmente usa (imports nombrados,
// no `import * as LucideIcons`) para que Vite pueda hacer tree-shaking del
// resto del set de +1500 íconos de la librería y no infle el bundle.
// El mapa traduce el mismo nombre kebab-case que ya existía en
// roles.js/dashboard.js (ej. "shield-check") al componente PascalCase
// correspondiente (ShieldCheck).
const ICONS = {
  'activity': Activity,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'archive': Archive,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'award': Award,
  'bar-chart-3': BarChart3,
  'book-open': BookOpen,
  'boxes': Boxes,
  'briefcase': Briefcase,
  'building-2': Building2,
  'calculator': Calculator,
  'camera': Camera,
  'car': Car,
  'check': Check,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'clipboard-check': ClipboardCheck,
  'clipboard-list': ClipboardList,
  'clock': Clock,
  'credit-card': CreditCard,
  'dollar-sign': DollarSign,
  'file-bar-chart': FileBarChart,
  'file-check': FileCheck,
  'file-search': FileSearch,
  'file-text': FileText,
  'files': Files,
  'flag': Flag,
  'folder-open': FolderOpen,
  'git-commit': GitCommit,
  'globe': Globe,
  'help-circle': HelpCircle,
  'history': History,
  'inbox': Inbox,
  'info': Info,
  'landmark': Landmark,
  'layout-dashboard': LayoutDashboard,
  'list-checks': ListChecks,
  'loader-2': Loader2,
  'lock': Lock,
  'log-out': LogOut,
  'mail': Mail,
  'map': Map,
  'map-pin': MapPin,
  'menu': Menu,
  'moon': Moon,
  'pen-tool': PenTool,
  'pie-chart': PieChart,
  'refresh-cw': RefreshCw,
  'route': Route,
  'save': Save,
  'search': Search,
  'settings': Settings,
  'shield': Shield,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  'ship': Ship,
  'star': Star,
  'sun': Sun,
  'target': Target,
  'timer': Timer,
  'trash-2': Trash2,
  'trending-up': TrendingUp,
  'truck': Truck,
  'users': Users,
  'warehouse': Warehouse,
  'x': X,
  'zap': Zap,
};

export default function Icon({ name, ...props }) {
  const Component = ICONS[name] || HelpCircle;
  return <Component {...props} />;
}
