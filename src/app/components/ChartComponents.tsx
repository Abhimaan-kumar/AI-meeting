import { useTheme } from "../context/ThemeContext";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { useState, useEffect } from "react";

interface ChartProps {
  data: any[];
}

// Wrapper components to isolate Recharts instances with unique IDs using React's useId
export function MeetingsAreaChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '160px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No meeting data available yet
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="meetingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="day" 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            color: isDark ? '#e5e7eb' : '#1f2937'
          }} 
        />
        <Area 
          type="monotone" 
          dataKey="meetings" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill={`url(#meetingsGradient)`}
          strokeWidth={2} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

MeetingsAreaChart.displayName = "MeetingsAreaChart";

export function ActionsLineChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '160px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No action items data available yet
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="week" 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke={isDark ? '#9ca3af' : '#6b7280'} 
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            color: isDark ? '#e5e7eb' : '#1f2937'
          }} 
        />
        <Legend 
          wrapperStyle={{ 
            fontSize: '12px',
            color: isDark ? '#e5e7eb' : '#1f2937'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="created" 
          stroke="#8b5cf6" 
          strokeWidth={2} 
          dot={{ fill: '#8b5cf6', r: 3 }}
          name="Created"
        />
        <Line 
          type="monotone" 
          dataKey="completed" 
          stroke="#10b981" 
          strokeWidth={2} 
          dot={{ fill: '#10b981', r: 3 }}
          name="Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

ActionsLineChart.displayName = "ActionsLineChart";

export function MeetingsTrendChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '250px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No trend data available yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="month" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#fff', 
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#e5e7eb' : '#1f2937'
            }} 
          />
          <Legend wrapperStyle={{ color: isDark ? '#e5e7eb' : '#1f2937' }} />
          <Line 
            type="monotone" 
            dataKey="meetings" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            name="Meetings"
          />
          <Line 
            type="monotone" 
            dataKey="actions" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Actions"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

MeetingsTrendChart.displayName = "MeetingsTrendChart";

export function ActionsPieChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '250px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No action status data available yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            style={{ fill: isDark ? '#e5e7eb' : '#1f2937' }}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-pie-${entry.id}-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#fff', 
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#e5e7eb' : '#1f2937'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

ActionsPieChart.displayName = "ActionsPieChart";

export function DurationBarChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '250px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No meeting duration data available yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="duration" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#fff', 
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#e5e7eb' : '#1f2937'
            }} 
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Meetings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

DurationBarChart.displayName = "DurationBarChart";

export function CompletionLineChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '100%', height: '100%', minHeight: '250px' }} />;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: '14px', textAlign: 'center' }}>
          No completion rate data available yet
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
          <XAxis dataKey="week" stroke={isDark ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#fff', 
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
              borderRadius: '8px',
              color: isDark ? '#e5e7eb' : '#1f2937'
            }}
            formatter={(value: any) => `${value}%`}
          />
          <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#10b981" 
            strokeWidth={3}
            name="Completion Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

CompletionLineChart.displayName = "CompletionLineChart";