import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MaterialSymbol } from 'react-material-symbols';
import { apiFetch } from '../utils/api';
import { useI18n } from '../i18n';

export default function ReportsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalDevices: 0,
    avgMovement: 0,
    avgTemp: 0,
    healthScore: 0,
    connectivity: 0,
  });
  const [activityTrend, setActivityTrend] = useState([]);
  const [speciesDistribution, setSpeciesDistribution] = useState([]);
  const [breedDistribution, setBreedDistribution] = useState([]);
  const [activityDistribution, setActivityDistribution] = useState({ grazing: 0, moving: 0, resting: 0 });
  const [animalsByBreed, setAnimalsByBreed] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await apiFetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        
        setStats({
          totalAnimals: data.stats?.total_animals || 0,
          totalDevices: data.stats?.total_devices || 0,
          avgMovement: data.stats?.avg_movement || 0,
          avgTemp: data.stats?.avg_temp || 0,
          healthScore: data.stats?.health_score || 0,
          connectivity: data.stats?.connectivity || 0,
        });
        
        setActivityTrend(data.activity_trend || []);
        setSpeciesDistribution(data.species_distribution || []);
        setBreedDistribution(data.breed_distribution || []);
        setActivityDistribution(data.activity_distribution || { grazing: 0, moving: 0, resting: 0 });
        
        const breedData = data.breed_distribution || [];
        setAnimalsByBreed(breedData.map(b => [b.breed, b.count]));
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-brand-primary tracking-tight font-['Manrope']">
            {t('reportsPage.fleetReports')}
          </h2>
          <p className="text-green-600 font-medium">
            {t('reportsPage.herdDescription')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-neutral-100/50 shadow-sm">
            <MaterialSymbol icon="calendar_today" className="text-neutral-500 mr-2 text-xl" />
            <span className="text-sm font-semibold text-stone-700">Oct 1, 2023 - Oct 31, 2023</span>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-neutral-100/50 shadow-sm cursor-pointer">
            <MaterialSymbol icon="layers" className="text-neutral-500 mr-2 text-xl" />
            <span className="text-sm font-semibold text-stone-700">All Herds</span>
            <MaterialSymbol icon="expand_more" className="text-neutral-500 ml-2" />
          </div>
          <button className="bg-gradient-to-b from-yellow-600 to-yellow-600 text-yellow-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow">
            <MaterialSymbol icon="ios_share" />
            {t('reports.export')}
          </button>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex gap-8 border-b border-neutral-100">
        <button 
          onClick={() => setActiveTab('activity')}
          className={`pb-4 px-2 border-b-2 font-bold text-sm transition-colors ${
            activeTab === 'activity' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-neutral-500 hover:text-stone-600'
          }`}
        >
          {t('reportsPage.activity')}
        </button>
        <button 
          onClick={() => setActiveTab('temperature')}
          className={`pb-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'temperature' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-neutral-500 hover:text-stone-600'
          }`}
        >
          {t('reportsPage.temp')}
        </button>
        <button 
          onClick={() => setActiveTab('health')}
          className={`pb-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === 'health' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-neutral-500 hover:text-stone-600'
          }`}
        >
          {t('reportsPage.healthTrends')}
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary">
            <MaterialSymbol icon="directions_walk" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('reportsPage.avgMovement')}</p>
            <h4 className="text-2xl font-black text-brand-primary">
              {stats.avgMovement} <span className="text-sm font-normal text-stone-400">{t('reportsPage.km')}</span>
            </h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary">
            <MaterialSymbol icon="thermostat" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('reportsPage.avgTemp')}</p>
            <h4 className="text-2xl font-black text-brand-primary">
              {stats.avgTemp} <span className="text-sm font-normal text-stone-400">{t('reportsPage.celsius')}</span>
            </h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary">
            <MaterialSymbol icon="favorite" className="fill" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('reportsPage.healthScore')}</p>
            <h4 className="text-2xl font-black text-brand-primary">{stats.healthScore}%</h4>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-brand-primary">
            <MaterialSymbol icon="bolt" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">{t('reportsPage.connectivity')}</p>
            <h4 className="text-2xl font-black text-brand-primary">{stats.connectivity}%</h4>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-brand-primary font-['Manrope']">{t('reportsPage.activityTrend')}</h3>
            <p className="text-sm text-stone-500">{t('reportsPage.dailyDistance')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-primary"></span>
              <span className="text-xs font-semibold text-stone-600">{t('reportsPage.actual')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-stone-200"></span>
              <span className="text-xs font-semibold text-stone-600">{t('reportsPage.forecast')}</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 w-full relative flex items-end justify-between gap-1">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-stone-300 w-full"></div>
            <div className="border-b border-stone-300 w-full"></div>
            <div className="border-b border-stone-300 w-full"></div>
            <div className="border-b border-stone-300 w-full"></div>
          </div>
          
          <svg className="absolute bottom-0 left-0 w-full h-full text-brand-primary/10" preserveAspectRatio="none" viewBox="0 0 1000 100">
            <path d="M0,80 Q50,70 100,75 T200,60 T300,65 T400,40 T500,50 T600,45 T700,55 T800,30 T900,40 T1000,35 L1000,100 L0,100 Z"></path>
            <path className="text-brand-primary" d="M0,80 Q50,70 100,75 T200,60 T300,65 T400,40 T500,50 T600,45 T700,55 T800,30 T900,40 T1000,35" fill="none" stroke="currentColor" strokeWidth="2"></path>
          </svg>
          
          <div className="absolute -bottom-6 w-full flex justify-between text-[10px] text-stone-400 font-bold uppercase tracking-widest px-2">
            <span>Oct 01</span>
            <span>Oct 07</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
            <span>Oct 31</span>
          </div>
        </div>
      </section>

      {/* Bottom Row: Comparison & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        {/* Group Comparison Bar Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-brand-primary font-['Manrope']">{t('reportsPage.distanceByGroup')}</h3>
            <MaterialSymbol icon="more_horiz" className="text-stone-300" />
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-stone-700">Racing Camels (Elite)</span>
                <span className="text-brand-primary">12.4 km</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-stone-700">Breeding Herd (North)</span>
                <span className="text-brand-primary">7.8 km</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary/60 rounded-full" style={{ width: '55%' }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-stone-700">Grazing Sheep (West)</span>
                <span className="text-brand-primary">5.2 km</span>
              </div>
              <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary/30 rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Distribution Donut Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-brand-primary font-['Manrope']">{t('reportsPage.activityDistribution')}</h3>
            <MaterialSymbol icon="more_horiz" className="text-stone-300" />
          </div>
          <div className="flex items-center gap-12">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#eeeee9" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#002819" strokeDasharray="60 100" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#D4AF37" strokeDasharray="25 100" strokeDashoffset="-60" strokeWidth="4"></circle>
                <circle cx="18" cy="18" fill="transparent" r="16" stroke="#b6ccbe" strokeDasharray="15 100" strokeDashoffset="-85" strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-brand-primary">2.4k</span>
                <span className="text-[9px] uppercase font-bold text-stone-400 tracking-widest">{t('reportsPage.dataPoints')}</span>
              </div>
            </div>
            <div className="space-y-4 flex-grow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-primary"></span>
                  <span className="text-sm font-semibold text-stone-600">{t('reportsPage.grazing')}</span>
                </div>
                <span className="text-sm font-bold text-brand-primary">60%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-accent"></span>
                  <span className="text-sm font-semibold text-stone-600">{t('reportsPage.moving')}</span>
                </div>
                <span className="text-sm font-bold text-brand-primary">25%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-200"></span>
                  <span className="text-sm font-semibold text-stone-600">{t('reportsPage.resting')}</span>
                </div>
                <span className="text-sm font-bold text-brand-primary">15%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

