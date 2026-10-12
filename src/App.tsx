import { useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

import {
  Activity,
  AlertTriangle,
  BatteryMedium,
  Bell,
  CheckCircle2,
  Droplets,
  Fan,
  LayoutDashboard,
  Menu,
  Monitor,
  Settings,
  SlidersHorizontal,
  Thermometer,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SensorReading = {
  time: string;
  temperature: number;
  humidity: number;
};

type Page =
  | "dashboard"
  | "monitoring"
  | "control"
  | "alerts"
  | "settings";

type FanMode = "automatic" | "manual";

type AlertItem = {
  id: number;
  type: "danger" | "warning" | "info" | "success";
  title: string;
  message: string;
  time: string;
};

const initialData: SensorReading[] = [
  { time: "10:00", temperature: 31.2, humidity: 76 },
  { time: "10:05", temperature: 31.6, humidity: 75 },
  { time: "10:10", temperature: 32.1, humidity: 74 },
  { time: "10:15", temperature: 32.4, humidity: 72.5 },
  { time: "10:20", temperature: 32.8, humidity: 71 },
  { time: "10:25", temperature: 33.0, humidity: 70 },
  { time: "10:30", temperature: 32.7, humidity: 69 },
  { time: "10:35", temperature: 32.4, humidity: 68 },
];

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [temperature, setTemperature] = useState(32.4);
  const [humidity, setHumidity] = useState(72.5);
  const [battery, setBattery] = useState(84);

  const [fanOn, setFanOn] = useState(true);
  const [simulationMode] = useState(true);

  const [fanMode, setFanMode] =
    useState<FanMode>("automatic");

  const [humidityOnThreshold, setHumidityOnThreshold] =
    useState(75);

  const [humidityOffThreshold, setHumidityOffThreshold] =
    useState(65);

  const [temperatureThreshold, setTemperatureThreshold] =
    useState(35);

  const [sensorData, setSensorData] =
    useState<SensorReading[]>(initialData);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const temperatureRef = useRef(32.4);
  const humidityRef = useRef(72.5);
  const batteryRef = useRef(84);
  const fanOnRef = useRef(true);
  const lastAlertRef = useRef<string | null>(null);
  

  useEffect(() => {
    fanOnRef.current = fanOn;
  }, [fanOn]);

  /*
   * LOAD LATEST SENSOR READING
   */

  const loadLatestSensorReading = async () => {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select(
        "temperature, humidity, battery, fan_status, recorded_at"
      )
      .eq("device_id", "VAST-ESP32-001")
      .order("recorded_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to load latest sensor reading:",
        error
      );
      return;
    }

    if (!data) {
      console.log("No sensor reading found.");
      return;
    }

    setTemperature(Number(data.temperature));
    setHumidity(Number(data.humidity));
    setBattery(Number(data.battery));
    setFanOn(Boolean(data.fan_status));

    temperatureRef.current = Number(data.temperature);
    humidityRef.current = Number(data.humidity);
    batteryRef.current = Number(data.battery);
    fanOnRef.current = Boolean(data.fan_status);

    console.log(
      "Dashboard updated from Supabase:",
      data
    );
  };

  /*
   * LOAD SENSOR HISTORY
   */

  const loadSensorHistory = async () => {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select(
        "temperature, humidity, battery, fan_status, recorded_at"
      )
      .eq("device_id", "VAST-ESP32-001")
      .order("recorded_at", {
        ascending: false,
      })
      .limit(20);

    if (error) {
      console.error(
        "Failed to load sensor history:",
        error
      );
      return;
    }

    if (!data) return;

    const history: SensorReading[] = data
      .reverse()
      .map((item) => ({
        time: new Date(
          item.recorded_at
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),

        temperature: Number(item.temperature),
        humidity: Number(item.humidity),
      }));

    setSensorData(history);

    console.log(
      "Sensor history loaded from Supabase:",
      history
    );
  };

  /*
   * LOAD SYSTEM SETTINGS
   */

  const loadSystemSettings = async () => {
    const { data, error } = await supabase
      .from("system_settings")
      .select(
        "fan_mode, humidity_on_threshold, humidity_off_threshold, temperature_threshold"
      )
      .eq("device_id", "VAST-ESP32-001")
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to load system settings:",
        error
      );
      return;
    }

    if (!data) {
      console.log("No system settings found.");
      return;
    }

    setFanMode(data.fan_mode as FanMode);

    setHumidityOnThreshold(
      Number(data.humidity_on_threshold)
    );

    setHumidityOffThreshold(
      Number(data.humidity_off_threshold)
    );

    setTemperatureThreshold(
      Number(data.temperature_threshold)
    );

    console.log(
      "System settings loaded from Supabase:",
      data
    );
  };
  const loadAlerts = async () => {
  const { data, error } = await supabase
    .from("alerts")
    .select(
      "id, alert_type, title, message, temperature, humidity, battery, created_at"
    )
    .eq("device_id", "VAST-ESP32-001")
    .order("created_at", {
      ascending: false,
    })
    .limit(20);

  if (error) {
    console.error(
      "Failed to load alerts:",
      error
    );
    return;
  }

  if (!data) return;

  const loadedAlerts: AlertItem[] = data.map((item) => ({
    id: Number(item.id),
    type: item.alert_type as AlertItem["type"],
    title: item.title,
    message: item.message,
    time: new Date(item.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  setAlerts(loadedAlerts);

  console.log(
    "Alerts loaded from Supabase:",
    loadedAlerts
  );
};

  /*
   * SAVE SYSTEM SETTINGS
   */

  const saveSystemSettings = async () => {
    const { error } = await supabase
      .from("system_settings")
      .update({
        fan_mode: fanMode,
        humidity_on_threshold:
          humidityOnThreshold,
        humidity_off_threshold:
          humidityOffThreshold,
        temperature_threshold:
          temperatureThreshold,
        updated_at: new Date().toISOString(),
      })
      .eq("device_id", "VAST-ESP32-001");

    if (error) {
      console.error(
        "Failed to save system settings:",
        error
      );
      return;
    }

    console.log(
      "System settings saved to Supabase."
    );
  };

  /*
   * INITIAL DATA LOAD + REFRESH
   */

  useEffect(() => {
    void loadLatestSensorReading();
    void loadSensorHistory();
    void loadSystemSettings();
    void loadAlerts();
    

    const interval = setInterval(() => {
      void loadLatestSensorReading();
      void loadSensorHistory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /*
   * SAVE SENSOR READING
   */

  const saveSensorReading = async (
    temperatureValue: number,
    humidityValue: number,
    batteryValue: number,
    fanStatus: boolean
  ) => {
    const { error } = await supabase
      .from("sensor_readings")
      .insert({
        device_id: "VAST-ESP32-001",
        temperature: temperatureValue,
        humidity: humidityValue,
        battery: batteryValue,
        fan_status: fanStatus,
      });

    if (error) {
      console.error(
        "Failed to save sensor reading:",
        error
      );
      return;
    }

    console.log(
      "Sensor reading saved to Supabase."
    );
  };

  /*
   * SIMULATED SENSOR DATA
   *
   * Later this section will be replaced with
   * real ESP32 + SHT30 data.
   */

  useEffect(() => {
    if (!simulationMode) return;

    const interval = setInterval(() => {
      const nextTemperature = Number(
        Math.min(
          38,
          Math.max(
            28,
            temperatureRef.current +
              (Math.random() - 0.5) * 0.6
          )
        ).toFixed(1)
      );

      const nextHumidity = Number(
        Math.min(
          85,
          Math.max(
            55,
            humidityRef.current +
              (Math.random() - 0.5) * 1.5
          )
        ).toFixed(1)
      );

      const nextBattery = Number(
        Math.max(
          0,
          batteryRef.current - 0.01
        ).toFixed(2)
      );

     temperatureRef.current =
  nextTemperature;

humidityRef.current =
  nextHumidity;

batteryRef.current =
  nextBattery;

setTemperature(nextTemperature);
setHumidity(nextHumidity);
setBattery(nextBattery);
      console.log(
        "Saving sensor reading...",
        {
          temperature: nextTemperature,
          humidity: nextHumidity,
          battery: nextBattery,
          fan: fanOnRef.current,
        }
      );

      void saveSensorReading(
        nextTemperature,
        nextHumidity,
        nextBattery,
        fanOnRef.current
      );
      }, 30000);

    return () => clearInterval(interval);
  }, [simulationMode]);

  /*
   * AUTOMATIC FAN CONTROL
   */

  useEffect(() => {
    if (fanMode !== "automatic") return;

    if (
      humidity >= humidityOnThreshold ||
      temperature >= temperatureThreshold
    ) {
      setFanOn(true);
    }

    if (
      humidity <= humidityOffThreshold &&
      temperature < temperatureThreshold
    ) {
      setFanOn(false);
    }
  }, [
    humidity,
    temperature,
    fanMode,
    humidityOnThreshold,
    humidityOffThreshold,
    temperatureThreshold,
  ]);

  /*
   * UPDATE GRAPH DATA
   */

  useEffect(() => {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setSensorData((current) => [
      ...current.slice(-19),
      {
        time,
        temperature,
        humidity,
      },
    ]);
  }, [temperature, humidity]);

  /*
   * GENERATE ALERTS
   */

  useEffect(() => {
    const now = new Date();
    console.log("Alert check running:", {
  temperature,
  humidity,
  battery,
  temperatureThreshold,
  humidityOnThreshold,
});

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    let newAlert: AlertItem | null = null;

    if (
      temperature >= temperatureThreshold
    ) {
      newAlert = {
        id: Date.now(),
        type: "danger",
        title: "High Temperature",
        message: `Temperature has reached ${temperature}°C.`,
        time,
      };
    } else if (
      humidity >= humidityOnThreshold
    ) {
      newAlert = {
        id: Date.now(),
        type: "warning",
        title: "High Humidity",
        message: `Humidity has reached ${humidity}%.`,
        time,
      };
    } else if (battery <= 20) {
      newAlert = {
        id: Date.now(),
        type: "danger",
        title: "Low Battery",
        message: `Battery level is only ${battery}%.`,
        time,
      };
    }

if (newAlert) {
  const alertToSave = newAlert;

  if (lastAlertRef.current !== alertToSave.title) {
    lastAlertRef.current = alertToSave.title;

    setAlerts((current) => [
      alertToSave,
      ...current,
    ].slice(0, 20));

    console.log(
      "Attempting to save alert:",
      alertToSave
    );

    void supabase
      .from("alerts")
      .insert({
        device_id: "VAST-ESP32-001",
        alert_type: alertToSave.type,
        title: alertToSave.title,
        message: alertToSave.message,
        temperature,
        humidity,
        battery,
      })
      .then(({ error }) => {
        if (error) {
          console.error(
            "Failed to save alert to Supabase:",
            error
          );
        } else {
          console.log(
            "Alert saved to Supabase:",
            alertToSave.title
          );
        }
      });
  }
} else {
  lastAlertRef.current = null;
}
  }, [
    temperature,
    humidity,
    battery,
    temperatureThreshold,
    humidityOnThreshold,
  ]);

  const navigate = (nextPage: Page) => {
    setPage(nextPage);
    setMobileMenu(false);
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenu
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-icon">
            <Droplets size={22} />
          </div>

          <div>
            <h2>SeaSense</h2>
            <p>Powered by VAST</p>
          </div>
        </div>

        <nav className="nav">

          <NavItem
            icon={
              <LayoutDashboard
                size={19}
              />
            }
            label="Dashboard"
            active={
              page === "dashboard"
            }
            onClick={() =>
              navigate("dashboard")
            }
          />

          <NavItem
            icon={
              <Monitor size={19} />
            }
            label="Monitoring"
            active={
              page === "monitoring"
            }
            onClick={() =>
              navigate("monitoring")
            }
          />

          <NavItem
            icon={
              <SlidersHorizontal
                size={19}
              />
            }
            label="Control"
            active={
              page === "control"
            }
            onClick={() =>
              navigate("control")
            }
          />

          <NavItem
            icon={
              <Bell size={19} />
            }
            label="Alerts"
            active={
              page === "alerts"
            }
            onClick={() =>
              navigate("alerts")
            }
            badge={alerts.length}
          />

          <NavItem
            icon={
              <Settings size={19} />
            }
            label="Settings"
            active={
              page === "settings"
            }
            onClick={() =>
              navigate("settings")
            }
          />

        </nav>

        <div className="sidebar-footer">
          <div className="system-small-status">
            <span className="online-dot"></span>

            <div>
              <strong>
                System Online
              </strong>

              <span>
                ESP32 Not Connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="header">

          <button
            className="mobile-menu"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
          >
            <Menu size={22} />
          </button>

          <div>
            <h1>
              {getPageTitle(page)}
            </h1>

            <p>
              SeaSense IoT Monitoring
              Platform
            </p>
          </div>

          <div className="header-right">
            <div className="online">
              <span></span>
              System Online
            </div>
          </div>

        </header>

        <section className="content">

          {page === "dashboard" && (
            <DashboardPage
              temperature={
                temperature
              }
              humidity={humidity}
              battery={battery}
              fanOn={fanOn}
              sensorData={
                sensorData
              }
              onMonitoring={() =>
                navigate(
                  "monitoring"
                )
              }
            />
          )}

          {page === "monitoring" && (
            <MonitoringPage
              temperature={
                temperature
              }
              humidity={humidity}
              battery={battery}
              fanOn={fanOn}
              sensorData={
                sensorData
              }
            />
          )}

          {page === "control" && (
            <ControlPage
              temperature={
                temperature
              }
              humidity={humidity}
              fanOn={fanOn}
              fanMode={fanMode}
              setFanMode={
                setFanMode
              }
              setFanOn={setFanOn}
              humidityOnThreshold={
                humidityOnThreshold
              }
              humidityOffThreshold={
                humidityOffThreshold
              }
              temperatureThreshold={
                temperatureThreshold
              }
              setHumidityOnThreshold={
                setHumidityOnThreshold
              }
              setHumidityOffThreshold={
                setHumidityOffThreshold
              }
              setTemperatureThreshold={
                setTemperatureThreshold
              }
              onSaveSettings={
                saveSystemSettings
              }
            />
          )}

          {page === "alerts" && (
            <AlertsPage
              alerts={alerts}
              temperature={
                temperature
              }
              humidity={humidity}
              battery={battery}
              fanOn={fanOn}
              clearAlerts={
                clearAlerts
              }
            />
          )}

          {page === "settings" && (
            <SettingsPage />
          )}

        </section>
      </main>
    </div>
  );
}

/* =========================================================
   ALERTS PAGE
========================================================= */

function AlertsPage({
  alerts,
  temperature,
  humidity,
  battery,
  fanOn,
  clearAlerts,
}: {
  alerts: AlertItem[];
  temperature: number;
  humidity: number;
  battery: number;
  fanOn: boolean;
  clearAlerts: () => void;
}) {
  const normal =
    temperature < 35 &&
    humidity < 75 &&
    battery > 20;

  return (
    <div>

      <div className="welcome">

        <div>
          <h2>
            System Alerts
          </h2>

          <p>
            Monitor important
            environmental and
            system events.
          </p>
        </div>

        {alerts.length > 0 && (
          <button
            className="clear-alerts"
            onClick={
              clearAlerts
            }
          >
            Clear Alerts
          </button>
        )}

      </div>

      {/* CURRENT CONDITIONS */}

      <div className="alert-summary-grid">

        <AlertSummaryCard
          icon={
            <Thermometer
              size={21}
            />
          }
          title="Temperature"
          value={`${temperature.toFixed(
            1
          )}°C`}
          status={
            temperature >= 35
              ? "High"
              : "Normal"
          }
          danger={
            temperature >= 35
          }
        />

        <AlertSummaryCard
          icon={
            <Droplets size={21} />
          }
          title="Humidity"
          value={`${humidity.toFixed(
            1
          )}%`}
          status={
            humidity >= 75
              ? "High"
              : "Normal"
          }
          danger={
            humidity >= 75
          }
        />

        <AlertSummaryCard
          icon={
            <BatteryMedium
              size={21}
            />
          }
          title="Battery"
          value={`${battery.toFixed(
            0
          )}%`}
          status={
            battery <= 20
              ? "Low"
              : "Normal"
          }
          danger={
            battery <= 20
          }
        />

        <AlertSummaryCard
          icon={
            <Fan size={21} />
          }
          title="Exhaust Fan"
          value={
            fanOn ? "ON" : "OFF"
          }
          status={
            fanOn
              ? "Running"
              : "Idle"
          }
          danger={false}
        />

      </div>

      {/* ALERT LIST */}

      <div className="card alerts-card">

        <div className="card-header">

          <div>
            <h3>
              Alert History
            </h3>

            <p>
              Recent system
              notifications and
              warnings
            </p>
          </div>

          <div className="alert-count">
            {alerts.length}{" "}
            {alerts.length === 1
              ? "Alert"
              : "Alerts"}
          </div>

        </div>

        {alerts.length === 0 ? (
          <div className="no-alerts">

            {normal ? (
              <>
                <div className="no-alert-icon success-icon">
                  <CheckCircle2
                    size={30}
                  />
                </div>

                <h3>
                  No Active Alerts
                </h3>

                <p>
                  SeaSense is
                  operating normally.
                  No abnormal
                  environmental
                  conditions have
                  been detected.
                </p>
              </>
            ) : (
              <>
                <div className="no-alert-icon">
                  <Bell size={30} />
                </div>

                <h3>
                  No Recorded Alerts
                </h3>

                <p>
                  Alerts will appear
                  here when a
                  monitored condition
                  exceeds its
                  configured threshold.
                </p>
              </>
            )}

          </div>
        ) : (
          <div className="alert-list">

            {alerts.map(
              (alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                />
              )
            )}

          </div>
        )}

      </div>

      {/* ALERT RULES */}

      <div className="card alert-rules-card">

        <div className="card-header">

          <div>
            <h3>
              Alert Conditions
            </h3>

            <p>
              Conditions currently
              monitored by SeaSense
            </p>
          </div>

        </div>

        <div className="alert-rules">

          <AlertRule
            icon={
              <Thermometer
                size={19}
              />
            }
            title="High Temperature"
            condition="Temperature ≥ 35°C"
            description="Triggers when chamber temperature reaches the configured limit."
          />

          <AlertRule
            icon={
              <Droplets size={19} />
            }
            title="High Humidity"
            condition="Humidity ≥ 75%"
            description="Triggers when chamber humidity reaches the configured limit."
          />

          <AlertRule
            icon={
              <BatteryMedium
                size={19}
              />
            }
            title="Low Battery"
            condition="Battery ≤ 20%"
            description="Warns when the system battery becomes critically low."
          />

          <AlertRule
            icon={
              <Wifi size={19} />
            }
            title="Connection Status"
            condition="ESP32 connection"
            description="Used to monitor communication between SeaSense and the controller."
          />

        </div>
      </div>

    </div>
  );
}

/* =========================================================
   ALERT COMPONENTS
========================================================= */

function AlertSummaryCard({
  icon,
  title,
  value,
  status,
  danger,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  status: string;
  danger: boolean;
}) {
  return (
    <div
      className={`alert-summary-card ${
        danger
          ? "alert-danger"
          : ""
      }`}
    >

      <div className="alert-summary-top">

        <div className="alert-summary-icon">
          {icon}
        </div>

        <span
          className={`alert-status ${
            danger
              ? "danger"
              : "normal"
          }`}
        >
          {status}
        </span>

      </div>

      <div className="alert-summary-title">
        {title}
      </div>

      <div className="alert-summary-value">
        {value}
      </div>

    </div>
  );
}

function AlertRow({
  alert,
}: {
  alert: AlertItem;
}) {
  const icon =
    alert.type === "danger" ? (
      <XCircle size={22} />
    ) : alert.type === "warning" ? (
      <AlertTriangle
        size={22}
      />
    ) : alert.type ===
      "success" ? (
      <CheckCircle2
        size={22}
      />
    ) : (
      <Bell size={22} />
    );

  return (
    <div
      className={`alert-row alert-${alert.type}`}
    >

      <div className="alert-row-icon">
        {icon}
      </div>

      <div className="alert-row-content">

        <div className="alert-row-title">
          {alert.title}
        </div>

        <div className="alert-row-message">
          {alert.message}
        </div>

      </div>

      <div className="alert-row-time">
        {alert.time}
      </div>

    </div>
  );
}

function AlertRule({
  icon,
  title,
  condition,
  description,
}: {
  icon: ReactNode;
  title: string;
  condition: string;
  description: string;
}) {
  return (
    <div className="alert-rule">

      <div className="alert-rule-icon">
        {icon}
      </div>

      <div className="alert-rule-content">

        <strong>
          {title}
        </strong>

        <span>
          {condition}
        </span>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function DashboardPage({
  temperature,
  humidity,
  battery,
  fanOn,
  sensorData,
  onMonitoring,
}: {
  temperature: number;
  humidity: number;
  battery: number;
  fanOn: boolean;
  sensorData: SensorReading[];
  onMonitoring: () => void;
}) {
  return (
    <div>

      <div className="welcome">

        <div>
          <h2>
            Good evening 👋
          </h2>

          <p>
            Here's the current
            status of your seaweed
            drying system.
          </p>
        </div>

      </div>

      <div className="stats">

        <StatCard
          title="Temperature"
          value={`${temperature.toFixed(
            1
          )}°C`}
          icon={
            <Thermometer
              size={24}
            />
          }
          type="temperature"
        />

        <StatCard
          title="Humidity"
          value={`${humidity.toFixed(
            1
          )}%`}
          icon={
            <Droplets size={24} />
          }
          type="humidity"
        />

        <StatCard
          title="Exhaust Fan"
          value={
            fanOn ? "ON" : "OFF"
          }
          icon={
            <Fan size={24} />
          }
          type="fan"
        />

        <StatCard
          title="Battery"
          value={`${battery.toFixed(
            0
          )}%`}
          icon={
            <BatteryMedium
              size={24}
            />
          }
          type="battery"
        />

      </div>

      <div className="dashboard-grid">

        <div className="card chart">

          <div className="card-header">

            <div>
              <h3>
                Environmental
                Monitoring
              </h3>

              <p>
                Temperature and
                humidity readings
              </p>
            </div>

            <button
              className="view-button"
              onClick={
                onMonitoring
              }
            >
              View Details
            </button>

          </div>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={285}
            >

              <LineChart
                data={sensorData}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="time"
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature °C"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity %"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />

              </LineChart>

            </ResponsiveContainer>

          </div>
        </div>

        <div className="card">

          <div className="card-header">

            <div>
              <h3>
                System Status
              </h3>

              <p>
                Current hardware
                condition
              </p>
            </div>

            <Activity size={20} />

          </div>

          <div className="status-list">

            <StatusRow
              name="ESP32 Controller"
              value="Not Connected"
              status="normal"
              icon={
                <Zap size={18} />
              }
            />

            <StatusRow
              name="SHT30 Sensor"
              value="Not Connected"
              status="normal"
              icon={
                <Thermometer
                  size={18}
                />
              }
            />

            <StatusRow
              name="Wi-Fi"
              value="Simulation"
              status="normal"
              icon={
                <Wifi size={18} />
              }
            />

            <StatusRow
              name="Exhaust Fan"
              value={
                fanOn
                  ? "Running"
                  : "Idle"
              }
              status={
                fanOn
                  ? "good"
                  : "normal"
              }
              icon={
                <Fan size={18} />
              }
            />

          </div>

          <div className="drying-status">

            <div>
              <span>
                Current Drying
                Status
              </span>

              <strong>
                {fanOn
                  ? "Ventilation Active"
                  : "Monitoring"}
              </strong>
            </div>

            <div className="fan-mode">
              <Fan size={18} />

              {fanOn
                ? "Fan ON"
                : "Fan OFF"}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   MONITORING
========================================================= */

function MonitoringPage({
  temperature,
  humidity,
  battery,
  fanOn,
  sensorData,
}: {
  temperature: number;
  humidity: number;
  battery: number;
  fanOn: boolean;
  sensorData: SensorReading[];
}) {
  const temperatures =
    sensorData.map(
      (item) =>
        item.temperature
    );

  const humidities =
    sensorData.map(
      (item) =>
        item.humidity
    );

  const averageTemperature =
    temperatures.reduce(
      (a, b) => a + b,
      0
    ) /
    temperatures.length;

  const averageHumidity =
    humidities.reduce(
      (a, b) => a + b,
      0
    ) /
    humidities.length;

  const minTemperature =
    Math.min(...temperatures);

  const maxTemperature =
    Math.max(...temperatures);

  return (
    <div>

      <div className="welcome">

        <div>

          <h2>
            Environmental
            Monitoring
          </h2>

          <p>
            Real-time temperature
            and humidity monitoring
            inside the drying chamber.
          </p>

        </div>

      </div>

      <div className="stats">

        <StatCard
          title="Temperature"
          value={`${temperature.toFixed(
            1
          )}°C`}
          icon={
            <Thermometer
              size={24}
            />
          }
          type="temperature"
        />

        <StatCard
          title="Humidity"
          value={`${humidity.toFixed(
            1
          )}%`}
          icon={
            <Droplets size={24} />
          }
          type="humidity"
        />

        <StatCard
          title="Fan"
          value={
            fanOn ? "ON" : "OFF"
          }
          icon={
            <Fan size={24} />
          }
          type="fan"
        />

        <StatCard
          title="Battery"
          value={`${battery.toFixed(
            0
          )}%`}
          icon={
            <BatteryMedium
              size={24}
            />
          }
          type="battery"
        />

      </div>

      <div className="card large-chart">

        <div className="card-header">

          <div>
            <h3>
              Environmental
              History
            </h3>

            <p>
              Recent sensor readings
            </p>
          </div>

        </div>

        <div className="chart-container large">

          <ResponsiveContainer
            width="100%"
            height={360}
          >

            <LineChart
              data={sensorData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="time"
              />

              <YAxis />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature °C"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity %"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </div>

      <div className="monitoring-grid">

        <MonitoringStat
          label="Average Temperature"
          value={`${averageTemperature.toFixed(
            1
          )}°C`}
        />

        <MonitoringStat
          label="Average Humidity"
          value={`${averageHumidity.toFixed(
            1
          )}%`}
        />

        <MonitoringStat
          label="Minimum Temperature"
          value={`${minTemperature.toFixed(
            1
          )}°C`}
        />

        <MonitoringStat
          label="Maximum Temperature"
          value={`${maxTemperature.toFixed(
            1
          )}°C`}
        />

      </div>

      <div className="card">

        <div className="card-header">

          <div>

            <h3>
              Sensor Information
            </h3>

            <p>
              Environmental sensor
              currently connected to
              ESP32
            </p>

          </div>

        </div>

        <div className="sensor-info">

          <SensorInfo
            label="Sensor"
            value="SHT30"
          />

          <SensorInfo
            label="Measurement"
            value="Temperature & Relative Humidity"
          />

          <SensorInfo
            label="Interface"
            value="I²C"
          />

          <SensorInfo
            label="Controller"
            value="ESP32"
          />

          <SensorInfo
            label="Status"
            value="Active"
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   CONTROL
========================================================= */

function ControlPage({
  temperature,
  humidity,
  fanOn,
  fanMode,
  setFanMode,
  setFanOn,
  humidityOnThreshold,
  humidityOffThreshold,
  temperatureThreshold,
  setHumidityOnThreshold,
  setHumidityOffThreshold,
  setTemperatureThreshold,
  onSaveSettings,
}: {
  temperature: number;
  humidity: number;
  fanOn: boolean;
  fanMode: FanMode;

  setFanMode: (
    mode: FanMode
  ) => void;

  setFanOn: (
    value: boolean
  ) => void;

  humidityOnThreshold: number;

  humidityOffThreshold: number;

  temperatureThreshold: number;

  setHumidityOnThreshold: (
    value: number
  ) => void;

  setHumidityOffThreshold: (
    value: number
  ) => void;

  setTemperatureThreshold: (
    value: number
  ) => void;

  onSaveSettings: () => Promise<void>;
}) {
  return (
    <div>

      <div className="welcome">

        <div>

          <h2>
            System Control
          </h2>

          <p>
            Configure automatic
            drying behavior and
            control the exhaust fan.
          </p>

        </div>

      </div>

      <div className="control-status-grid">

        <div className="control-status-card">

          <div className="control-status-icon">
            <Thermometer
              size={21}
            />
          </div>

          <span>
            Temperature
          </span>

          <strong>
            {temperature.toFixed(
              1
            )}°C
          </strong>

        </div>

        <div className="control-status-card">

          <div className="control-status-icon">
            <Droplets size={21} />
          </div>

          <span>
            Humidity
          </span>

          <strong>
            {humidity.toFixed(
              1
            )}%
          </strong>

        </div>

        <div className="control-status-card">

          <div className="control-status-icon">
            <Fan size={21} />
          </div>

          <span>
            Fan Status
          </span>

          <strong
            className={
              fanOn
                ? "status-on"
                : "status-off"
            }
          >
            {fanOn
              ? "ON"
              : "OFF"}
          </strong>

        </div>

      </div>

      <div className="card control-card">

        <div className="card-header">

          <div>

            <h3>
              Fan Operation Mode
            </h3>

            <p>
              Select how the exhaust
              fan should operate.
            </p>

          </div>

        </div>

        <div className="mode-selector">

          <button
            className={`mode-button ${
              fanMode === "automatic"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setFanMode(
                "automatic"
              )
            }
          >

            <div className="mode-icon">
              <Activity size={20} />
            </div>

            <div>

              <strong>
                Automatic
              </strong>

              <span>
                Fan responds
                automatically to sensor
                thresholds.
              </span>

            </div>

            <div className="radio-circle">
              {fanMode ===
                "automatic" && (
                <span />
              )}
            </div>

          </button>

          <button
            className={`mode-button ${
              fanMode === "manual"
                ? "selected"
                : ""
            }`}
            onClick={() =>
              setFanMode("manual")
            }
          >

            <div className="mode-icon">
              <SlidersHorizontal
                size={20}
              />
            </div>

            <div>

              <strong>
                Manual
              </strong>

              <span>
                Operator controls the
                fan directly.
              </span>

            </div>

            <div className="radio-circle">
              {fanMode ===
                "manual" && (
                <span />
              )}
            </div>

          </button>

        </div>

      </div>

      <div className="card control-card">

        <div className="card-header">

          <div>

            <h3>
              Manual Fan Control
            </h3>

            <p>
              Available when Manual
              mode is selected.
            </p>

          </div>

        </div>

        <div className="manual-control">

          <div className="manual-label">

            <div
              className={`fan-dot ${
                fanOn
                  ? "fan-toggle-on"
                  : ""
              }`}
            >
              <Fan size={24} />
            </div>

            <div>

              <strong>
                Exhaust Fan
              </strong>

              <span>

                {fanMode ===
                "automatic"
                  ? "Automatic control active"
                  : fanOn
                  ? "Fan is currently running"
                  : "Fan is currently off"}

              </span>

            </div>

          </div>

          <button
            className={`fan-toggle ${
              fanOn
                ? "fan-toggle-on"
                : ""
            }`}
            disabled={
              fanMode ===
              "automatic"
            }
            onClick={() =>
              setFanOn(!fanOn)
            }
          >
            <span></span>

            {fanOn
              ? "ON"
              : "OFF"}

          </button>

        </div>

        {fanMode ===
          "automatic" && (
          <div className="control-note">

            <Activity size={17} />

            Manual control is
            disabled while Automatic
            mode is active.

          </div>
        )}

      </div>

      <div className="card control-card">

        <div className="card-header">

          <div>

            <h3>
              Automatic Control
              Thresholds
            </h3>

            <p>
              Configure when the
              ventilation system should
              activate.
            </p>

          </div>

        </div>

        <div className="threshold-grid">

          <ThresholdControl
            label="Humidity ON"
            description="Fan turns ON when humidity reaches this level."
            value={
              humidityOnThreshold
            }
            suffix="%"
            onChange={
              setHumidityOnThreshold
            }
          />

          <ThresholdControl
            label="Humidity OFF"
            description="Fan turns OFF when humidity falls to this level."
            value={
              humidityOffThreshold
            }
            suffix="%"
            onChange={
              setHumidityOffThreshold
            }
          />

          <ThresholdControl
            label="Temperature Limit"
            description="Fan activates when temperature reaches this level."
            value={
              temperatureThreshold
            }
            suffix="°C"
            onChange={
              setTemperatureThreshold
            }
          />

        </div>

        <div className="automation-status">

          <div className="automation-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>

            <strong>
              Automatic control active
            </strong>

            <span>
              Fan activates at ≥{" "}
              {humidityOnThreshold}
              % humidity or ≥{" "}
              {temperatureThreshold}
              °C and stops at ≤{" "}
              {humidityOffThreshold}
              % humidity.
            </span>

          </div>

        </div>

        <div className="control-save-row">

          <button
            className="save-settings-button"
            onClick={() =>
              void onSaveSettings()
            }
          >
            Save Settings
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   THRESHOLD CONTROL
========================================================= */

function ThresholdControl({
  label,
  description,
  value,
  suffix,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  suffix: string;
  onChange: (
    value: number
  ) => void;
}) {
  return (
    <div className="threshold-card">

      <div>

        <strong>
          {label}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <div className="threshold-input">

        <input
          type="number"
          value={value}
          onChange={(event) =>
            onChange(
              Number(
                event.target.value
              )
            )
          }
        />

        <span>
          {suffix}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {
  return (
    <>
      <div className="welcome">

        <div>

          <h2>
            System Settings
          </h2>

          <p>
            Configure and review
            your SeaSense monitoring
            platform.
          </p>

        </div>

      </div>

      {/* DEVICE INFORMATION */}

      <div className="card settings-card">

        <div className="card-header">

          <div>

            <h3>
              Device Information
            </h3>

            <p>
              Basic information about
              the VAST drying system.
            </p>

          </div>

          <Settings size={20} />

        </div>

        <div className="settings-grid">

          <SettingItem
            label="Device Name"
            value="VAST-ESP32-001"
          />

          <SettingItem
            label="Controller"
            value="ESP32"
          />

          <SettingItem
            label="Environmental Sensor"
            value="SHT30"
          />

          <SettingItem
            label="Communication"
            value="Wi-Fi"
          />

        </div>

      </div>

      {/* HARDWARE CONNECTION */}

      <div className="card settings-card">

        <div className="card-header">

          <div>

            <h3>
              Hardware Connection
            </h3>

            <p>
              Current connection status
              of the VAST hardware.
            </p>

          </div>

          <Wifi size={20} />

        </div>

        <div className="connection-list">

          <ConnectionItem
            icon={
              <Zap size={19} />
            }
            name="ESP32 Controller"
            description="Main system controller"
            status="Not Connected"
            type="waiting"
          />

          <ConnectionItem
            icon={
              <Thermometer
                size={19}
              />
            }
            name="SHT30 Sensor"
            description="Temperature and humidity sensor"
            status="Not Connected"
            type="waiting"
          />

          <ConnectionItem
            icon={
              <Wifi size={19} />
            }
            name="Wi-Fi Connection"
            description="Internet communication"
            status="Simulation Active"
            type="simulation"
          />

        </div>

        <div className="simulation-notice">

          <Activity size={18} />

          <div>

            <strong>
              Development Simulation
              Mode
            </strong>

            <p>
              SeaSense is currently
              using simulated
              temperature, humidity,
              and battery data. The
              actual ESP32 and SHT30
              hardware will be
              connected during the
              hardware integration
              stage.
            </p>

          </div>

        </div>

      </div>

      {/* DRYING CONFIGURATION */}

      <div className="card settings-card">

        <div className="card-header">

          <div>

            <h3>
              Drying Configuration
            </h3>

            <p>
              Automatic ventilation
              control parameters.
            </p>

          </div>

          <SlidersHorizontal
            size={20}
          />

        </div>

        <div className="settings-config-grid">

          <div className="setting-input-card">

            <label>
              Humidity ON Threshold
            </label>

            <div className="setting-input-wrapper">

              <input
                type="number"
                defaultValue={75}
              />

              <span>
                %
              </span>

            </div>

            <p>
              Exhaust fan activates
              when humidity reaches
              this level.
            </p>

          </div>

          <div className="setting-input-card">

            <label>
              Humidity OFF Threshold
            </label>

            <div className="setting-input-wrapper">

              <input
                type="number"
                defaultValue={65}
              />

              <span>
                %
              </span>

            </div>

            <p>
              Exhaust fan stops when
              humidity falls to this
              level.
            </p>

          </div>

          <div className="setting-input-card">

            <label>
              Temperature Threshold
            </label>

            <div className="setting-input-wrapper">

              <input
                type="number"
                defaultValue={35}
              />

              <span>
                °C
              </span>

            </div>

            <p>
              Exhaust fan activates
              when temperature reaches
              this level.
            </p>

          </div>

        </div>

      </div>

      {/* SYSTEM INFORMATION */}

      <div className="card settings-card">

        <div className="card-header">

          <div>

            <h3>
              System Information
            </h3>

            <p>
              SeaSense and VAST
              project information.
            </p>

          </div>

          <Activity size={20} />

        </div>

        <div className="system-info-list">

          <SystemInfoRow
            label="Platform"
            value="SeaSense"
          />

          <SystemInfoRow
            label="Project"
            value="VAST"
          />

          <SystemInfoRow
            label="Version"
            value="1.0.0 Prototype"
          />

          <SystemInfoRow
            label="Development Status"
            value="Prototype"
          />

          <SystemInfoRow
            label="Hardware Status"
            value="Not Connected"
          />

        </div>

      </div>
    </>
  );
}

/* =========================================================
   SETTINGS COMPONENTS
========================================================= */

function SettingItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="setting-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function ConnectionItem({
  icon,
  name,
  description,
  status,
  type,
}: {
  icon: ReactNode;
  name: string;
  description: string;
  status: string;
  type:
    | "waiting"
    | "simulation";
}) {
  return (
    <div className="connection-item">

      <div className="connection-icon">
        {icon}
      </div>

      <div className="connection-details">

        <strong>
          {name}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <div
        className={`connection-status ${type}`}
      >
        <span></span>

        {status}
      </div>

    </div>
  );
}

function SystemInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="system-info-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   GENERAL COMPONENTS
========================================================= */

function NavItem({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      className={`nav-item ${
        active
          ? "active"
          : ""
      }`}
      onClick={onClick}
    >

      {icon}

      <span>
        {label}
      </span>

      {badge !==
        undefined &&
        badge > 0 && (
          <span className="nav-badge">
            {badge}
          </span>
        )}

    </button>
  );
}

function StatCard({
  title,
  value,
  icon,
  type,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  type: string;
}) {
  return (
    <div
      className={`stat-card ${type}`}
    >

      <div className="stat-content">

        <span>
          {title}
        </span>

        <strong className="stat-value">
          {value}
        </strong>

      </div>

      <div className="stat-icon">
        {icon}
      </div>

    </div>
  );
}

function StatusRow({
  name,
  value,
  status,
  icon,
}: {
  name: string;
  value: string;
  status:
    | "good"
    | "normal";
  icon: ReactNode;
}) {
  return (
    <div className="status-row">

      <div className="status-name">

        <div className="status-icon">
          {icon}
        </div>

        <span>
          {name}
        </span>

      </div>

      <span
        className={`status-value ${status}`}
      >
        {value}
      </span>

    </div>
  );
}

function MonitoringStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="monitoring-stat">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function SensorInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="sensor-info-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   PAGE TITLE
========================================================= */

function getPageTitle(
  page: Page
) {
  switch (page) {
    case "dashboard":
      return "Dashboard";

    case "monitoring":
      return "Monitoring";

    case "control":
      return "Control";

    case "alerts":
      return "Alerts";

    case "settings":
      return "Settings";

    default:
      return "SeaSense";
  }
}

export default App;