import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Circle, Rect, Line, G, Defs,
  LinearGradient as SvgGrad, Stop, ClipPath,
} from 'react-native-svg';
import { useTheme } from '../../../application/context/ThemeContext';

const { width } = Dimensions.get('window');
const CHART_W = width - 48;
const CHART_H = 140;

// ─── ICONS ────────────────────────────────────────────────────────────────────

const DownloadIcon = ({ color = '#334155' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

const BellIcon = ({ color = '#334155' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

const Polyline = ({ points, ...props }: any) => (
  <Path d={`M ${points}`} {...props} />
);

const TrendUpIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <Path d="m23 6-9.5 9.5-5-5L1 18" />
    <Path d="M17 6h6v6" />
  </Svg>
);

const TrendDownIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
    <Path d="m23 18-9.5-9.5-5 5L1 6" />
    <Path d="M17 18h6v-6" />
  </Svg>
);

const CashIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
    <Rect x="2" y="6" width="20" height="12" rx="2" />
    <Circle cx="12" cy="12" r="2" />
    <Path d="M6 12h.01M18 12h.01" />
  </Svg>
);

const UsersIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

const BotIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
    <Rect x="3" y="8" width="18" height="14" rx="2" />
    <Path d="M9 12h6M9 16h4" />
    <Path d="M12 8V4" />
    <Circle cx="12" cy="3" r="1" />
    <Circle cx="8" cy="12" r="1" fill="#22c55e" />
    <Circle cx="16" cy="12" r="1" fill="#22c55e" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const RocketIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
    <Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <Path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <Path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </Svg>
);

const HeadsetIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
    <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
    <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </Svg>
);

const FireIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
    <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </Svg>
);

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────

const BAR_DATA: Record<string, number[]> = {
  Today: [6, 9, 5, 11, 8, 14, 10, 13, 7, 12, 9, 15],
  Week:  [42, 58, 35, 71, 63, 89, 55],
  Month: [320, 410, 290, 500, 460, 380, 540, 430, 370, 490, 520, 445],
};

const BAR_LABELS: Record<string, string[]> = {
  Today: ['8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p'],
  Week:  ['MON','TUE','WED','THU','FRI','SAT','SUN'],
  Month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

const SalesChart = ({ period, totalRevenue }: { period: string; totalRevenue: string }) => {
  const { isDark } = useTheme();
  const data   = BAR_DATA[period];
  const labels = BAR_LABELS[period];
  const max    = Math.max(...data);

  const BAR_W   = (CHART_W - 32) / data.length - 6;
  const BAR_MAX = CHART_H - 36;

  const animVals = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    animVals.forEach(v => v.setValue(0));
    Animated.stagger(40, animVals.map(v =>
      Animated.spring(v, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false })
    )).start();
  }, [period]);

  // active bar (Wed for Week)
  const activeIdx = period === 'Week' ? 2 : period === 'Today' ? 6 : 4;

  return (
    <View style={styles.chartInner}>
      <View style={styles.chartBars}>
        {data.map((val, i) => {
          const barH = (val / max) * BAR_MAX;
          const isActive = i === activeIdx;
          return (
            <Animated.View
              key={i}
              style={{
                width: BAR_W,
                height: animVals[i].interpolate({ inputRange: [0, 1], outputRange: [0, barH] }),
                borderRadius: 6,
                backgroundColor: isActive ? '#22c55e' : (isDark ? '#022c22' : '#e8f5e9'),
                alignSelf: 'flex-end',
                overflow: 'hidden',
              }}
            >
              {isActive && (
                <LinearGradient
                  colors={['#4ade80', '#22c55e']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              )}
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        {labels.map((l, i) => (
          <Text
            key={l}
            style={[
              styles.chartLabel,
              i === activeIdx && styles.chartLabelActive,
            ]}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
};

// ─── DONUT CHART ─────────────────────────────────────────────────────────────

const DonutChart = ({ items }: { items: { label: string; pct: number; color: string; units: number }[] }) => {
  const { colors, isDark } = useTheme();
  const SIZE   = 120;
  const R      = 44;
  const STROKE = 18;
  const CIRC   = 2 * Math.PI * R;

  const animPct = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    animPct.setValue(0);
    Animated.timing(animPct, { toValue: 1, duration: 900, useNativeDriver: false }).start();
  }, []);

  // Build segments
  let offset = 0;
  const total = items.reduce((s, i) => s + i.pct, 0);

  return (
    <View style={styles.donutWrap}>
      <View style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <ClipPath id="clip">
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={R + STROKE / 2} />
            </ClipPath>
          </Defs>
          {/* Background ring */}
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke={isDark ? colors.border : "#f1f5f9"} strokeWidth={STROKE}
          />
          {/* Segments */}
          {items.map((item, i) => {
            const dash = (item.pct / 100) * CIRC;
            const seg = (
              <Circle
                key={i}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none"
                stroke={item.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRC - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${SIZE / 2},${SIZE / 2}`}
              />
            );
            offset += dash;
            return seg;
          })}
        </Svg>
        {/* Center label */}
        <View style={[styles.donutCenter, { width: SIZE, height: SIZE }]}>
          <Text style={[styles.donutCenterSub, { color: colors.subtitleText }]}>Total</Text>
          <Text style={[styles.donutCenterVal, { color: colors.titleText }]}>842</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.donutLegend}>
        {items.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <View>
              <Text style={[styles.legendLabel, { color: colors.titleText }]}>{item.label}</Text>
              <Text style={[styles.legendSub, { color: colors.subtitleText }]}>{item.pct}% • {item.units} units</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

const KpiCard = ({
  label, value, change, positive, icon, delay,
}: {
  label: string; value: string; change: string; positive: boolean;
  icon: React.ReactNode; delay: number;
}) => {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 55, friction: 8, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.kpiCard, {
      backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000',
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }]}>
      <View style={styles.kpiTop}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <View style={[styles.kpiIconWrap, { backgroundColor: isDark ? '#14532d80' : '#f0fdf4' }]}>{icon}</View>
      </View>
      <Text style={[styles.kpiValue, { color: colors.titleText }]}>{value}</Text>
      <View style={styles.kpiTrend}>
        {positive ? <TrendUpIcon /> : <TrendDownIcon />}
        <Text style={[styles.kpiChange, { color: positive ? '#22c55e' : '#ef4444' }]}>
          {change}
        </Text>
        <Text style={styles.kpiChangeSub}>vs last week</Text>
      </View>
    </Animated.View>
  );
};

// ─── MILESTONE ROW ────────────────────────────────────────────────────────────

const MilestoneRow = ({
  icon, iconBg, title, sub, delay,
}: {
  icon: React.ReactNode; iconBg: string; title: string; sub: string; delay: number;
}) => {
  const { colors, isDark } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 55, friction: 8, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.milestoneRow, {
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
    }]}>
      <View style={[styles.milestoneIcon, { backgroundColor: isDark ? colors.border : iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.milestoneTitle, { color: colors.titleText }]}>{title}</Text>
        <Text style={[styles.milestoneSub, { color: colors.subtitleText }]}>{sub}</Text>
      </View>
    </Animated.View>
  );
};

// ─── PERIOD SELECTOR ─────────────────────────────────────────────────────────

const PERIODS = ['Today', 'Week', 'Month'];

const PERIOD_DATA: Record<string, { avgTicket: string; retention: string; botSuccess: string; revenue: string }> = {
  Today: { avgTicket: '$18.30', retention: '71%', botSuccess: '91%', revenue: '$1,840' },
  Week:  { avgTicket: '$42.50', retention: '78%', botSuccess: '94%', revenue: '$12,450' },
  Month: { avgTicket: '$38.90', retention: '82%', botSuccess: '96%', revenue: '$48,200' },
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function BusinessInsights() {
  const { colors, isDark } = useTheme();
  const [period, setPeriod] = useState<'Today' | 'Week' | 'Month'>('Week');

  const headerAnim  = useRef(new Animated.Value(0)).current;
  const periodAnim  = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim,  { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(periodAnim,  { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const data = PERIOD_DATA[period];

  const donutItems = [
    { label: 'Organic Latte',  pct: 45, color: '#22c55e', units: 378 },
    { label: 'Avocado Toast',  pct: 30, color: '#94a3b8', units: 252 },
    { label: 'Matcha Tea',     pct: 25, color: '#e2e8f0', units: 212 },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
      }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>Business Insights</Text>
          <Text style={[styles.headerSub, { color: colors.subtitleText }]}>Last updated: 5 mins ago</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <DownloadIcon color={colors.titleText} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <View style={styles.notifDot} />
            <BellIcon color={colors.titleText} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── PERIOD SELECTOR ─────────────────────────────────── */}
        <Animated.View style={[styles.periodWrap, {
          backgroundColor: isDark ? colors.border : '#e8f5e9',
          opacity: periodAnim,
          transform: [{ scale: periodAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }],
        }]}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p as any)}
              activeOpacity={0.8}
            >
              {period === p ? (
                <LinearGradient
                  colors={isDark ? [colors.cardBg, colors.cardBg] : ['#fff', '#f8fafc']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              ) : null}
              <Text style={[styles.periodText, period === p && styles.periodTextActive, period === p && { color: colors.titleText }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }}>

          {/* ── KPI CARDS ─────────────────────────────────────── */}
          <KpiCard
            label="AVG TICKET"
            value={data.avgTicket}
            change="+2.4%"
            positive
            icon={<CashIcon />}
            delay={0}
          />
          <KpiCard
            label="RETENTION"
            value={data.retention}
            change="-1.2%"
            positive={false}
            icon={<UsersIcon />}
            delay={60}
          />
          <KpiCard
            label="BOT SUCCESS"
            value={data.botSuccess}
            change="+5.0%"
            positive
            icon={<BotIcon />}
            delay={120}
          />

          {/* ── SALES CHART ───────────────────────────────────── */}
          <View style={[styles.chartCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
             <View style={styles.chartHeader}>
               <View>
                 <Text style={[styles.chartTitle, { color: colors.titleText }]}>
                   {period === 'Today' ? 'Hourly Sales' : period === 'Week' ? 'Weekly Sales' : 'Monthly Sales'}
                 </Text>
                 <Text style={[styles.chartSub, { color: colors.subtitleText }]}>Revenue trends for current {period.toLowerCase()}</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                 <Text style={styles.chartRevenue}>{data.revenue}</Text>
                 <Text style={[styles.chartRevenueSub, { color: colors.subtitleText }]}>Total Revenue</Text>
               </View>
             </View>
             <SalesChart period={period} totalRevenue={data.revenue} />
           </View>

          {/* ── TOP SELLING ITEMS ─────────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Top Selling Items</Text>
            <DonutChart items={donutItems} />
          </View>

          {/* ── BOT MILESTONES ────────────────────────────────── */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000', marginBottom: 24 }]}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Bot Milestones</Text>
            <MilestoneRow
              icon={<RocketIcon />}
              iconBg="#ede9fe"
              title="100th Order Handled"
              sub="The AI assistant just completed its 100th automated checkout today."
              delay={0}
            />
            <MilestoneRow
              icon={<HeadsetIcon />}
              iconBg="#eff6ff"
              title="Support Escalation Avoided"
              sub="85% of queries were resolved without human intervention this hour."
              delay={80}
            />
            <MilestoneRow
              icon={<FireIcon />}
              iconBg="#fff7ed"
              title="Peak Order Rate"
              sub="Bot handled 12 simultaneous orders at 12:45 PM"
              delay={160}
            />
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── BOTTOM NAV ──────────────────────────────────────────── */}
      <View style={[styles.bottomNav, { backgroundColor: colors.pageBg, borderTopColor: colors.rowDivider }]}>
        {[
          { label: 'HOME',   active: false,
            icon: <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><Path d="M9 21V12h6v9"/></Svg> },
          { label: 'STATS',  active: true,
            icon: <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><Rect x="18" y="3" width="4" height="18" rx="1"/><Rect x="10" y="9" width="4" height="12" rx="1"/><Rect x="2" y="14" width="4" height="7" rx="1"/></Svg> },
          { label: 'ORDERS', active: false,
            icon: <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><Rect x="9" y="3" width="6" height="4" rx="1"/><Path d="M9 12h6M9 16h4"/></Svg> },
          { label: 'SETUP',  active: false,
            icon: <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><Circle cx="12" cy="12" r="3"/></Svg> },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.navItem} activeOpacity={0.7}>
            {item.icon}
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* FAB */}
        <View style={styles.fabWrap}>
          <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
            <LinearGradient colors={['#4ade80', '#22c55e']} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <Path d="M12 5v14M5 12h14" />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22c55e',
    zIndex: 1,
  },

  scroll: { paddingHorizontal: 20, paddingBottom: 100 },

  // Period
  periodWrap: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    padding: 4,
    marginTop: 12,
    marginBottom: 20,
  },
  periodBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 12, position: 'relative', overflow: 'hidden',
  },
  periodBtnActive: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  periodText:       { fontSize: 14, fontWeight: '600', color: '#64748b' },
  periodTextActive: { fontWeight: '800', color: '#0f172a' },

  // KPI
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  kpiLabel:   { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.4 },
  kpiIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  kpiValue:   { fontSize: 34, fontWeight: '900', color: '#0f172a', letterSpacing: -1, marginBottom: 8 },
  kpiTrend:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kpiChange:  { fontSize: 13, fontWeight: '700' },
  kpiChangeSub: { fontSize: 12, color: '#94a3b8' },

  // Chart
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle:       { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  chartSub:         { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  chartRevenue:     { fontSize: 20, fontWeight: '900', color: '#22c55e' },
  chartRevenueSub:  { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  chartInner:       { gap: 8 },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_H - 28,
    gap: 5,
    paddingHorizontal: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  chartLabel:       { fontSize: 9, color: '#94a3b8', fontWeight: '500' },
  chartLabelActive: { color: '#22c55e', fontWeight: '800' },

  // Section card
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },

  // Donut
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterSub: { fontSize: 10, color: '#94a3b8', fontWeight: '500' },
  donutCenterVal: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  donutLegend:    { flex: 1, gap: 12 },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot:      { width: 10, height: 10, borderRadius: 5 },
  legendLabel:    { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  legendSub:      { fontSize: 11, color: '#94a3b8' },

  // Milestones
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  milestoneIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  milestoneSub:   { fontSize: 12, color: '#64748b', lineHeight: 17 },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingHorizontal: 8,
  },
  navItem:       { flex: 1, alignItems: 'center', gap: 4 },
  navLabel:      { fontSize: 9, fontWeight: '600', color: '#94a3b8', letterSpacing: 0.5 },
  navLabelActive:{ color: '#22c55e' },
  fabWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 12,
    left: '50%',
    transform: [{ translateX: -28 }],
  },
  fab: {
    width: 56, height: 56, borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  fabGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});