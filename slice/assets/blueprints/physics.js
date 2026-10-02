// Собрано make_assets.py из ART/starship/v3-sketches/physics.json (calc_life.py).
window.M31_PHYSICS = {
 "radiation": {
  "D0_sv_per_year": 0.8,
  "risk_per_sv": 0.05,
  "awake_years": 13.0,
  "table": [
   {
    "x_gcm2": 0,
    "water_m": 0.0,
    "sv_per_year": 0.8,
    "awake_career_sv": 10.4,
    "awake_cancer_risk": 0.52,
    "sleeper_130y_sv": 104.0
   },
   {
    "x_gcm2": 50,
    "water_m": 0.5,
    "sv_per_year": 0.4882,
    "awake_career_sv": 6.35,
    "awake_cancer_risk": 0.317,
    "sleeper_130y_sv": 63.47
   },
   {
    "x_gcm2": 100,
    "water_m": 1.0,
    "sv_per_year": 0.3581,
    "awake_career_sv": 4.66,
    "awake_cancer_risk": 0.233,
    "sleeper_130y_sv": 46.56
   },
   {
    "x_gcm2": 200,
    "water_m": 2.0,
    "sv_per_year": 0.2095,
    "awake_career_sv": 2.72,
    "awake_cancer_risk": 0.136,
    "sleeper_130y_sv": 27.23
   },
   {
    "x_gcm2": 300,
    "water_m": 3.0,
    "sv_per_year": 0.1237,
    "awake_career_sv": 1.61,
    "awake_cancer_risk": 0.08,
    "sleeper_130y_sv": 16.08
   },
   {
    "x_gcm2": 500,
    "water_m": 5.0,
    "sv_per_year": 0.0432,
    "awake_career_sv": 0.56,
    "awake_cancer_risk": 0.028,
    "sleeper_130y_sv": 5.61
   },
   {
    "x_gcm2": 800,
    "water_m": 8.0,
    "sv_per_year": 0.0089,
    "awake_career_sv": 0.12,
    "awake_cancer_risk": 0.006,
    "sleeper_130y_sv": 1.16
   },
   {
    "x_gcm2": 1000,
    "water_m": 10.0,
    "sv_per_year": 0.0031,
    "awake_career_sv": 0.04,
    "awake_cancer_risk": 0.002,
    "sleeper_130y_sv": 0.4
   }
  ],
  "need_awake_gcm2": 390,
  "need_sleep_gcm2": 828,
  "ring_area_m2": 142122,
  "vault_area_m2": 25108,
  "shelter_area_m2": 7540,
  "ring_shield_kt": 555,
  "vault_shield_kt": 208,
  "shelter_shield_kt": 29,
  "core_kt": 34.85881754127601,
  "ism_proton_MeV": 4.69,
  "ism_heating_W_m2": 2.3
 },
 "rings": {
  "omega_rad_s": 0.2557,
  "rpm": 2.44,
  "rim_speed_m_s": 38.4,
  "floor_load_kg_m2": 3000.0,
  "contents_kg_per_m": 60000.0,
  "hoop_tension_MN": 88.3,
  "steel_section_m2": 0.227,
  "steel_hoop_t_per_m": 1.78,
  "self_stress_MPa": 11.5,
  "pressure_wall_mm": 3.0,
  "ring_structure_kt": 6.8,
  "verdict": "прочность не ограничивает: при 38 м/с обода кольцо нагружено слабо"
 },
 "engine": {
  "mass_to_energy_percent": 0.392,
  "ve_c": 0.04,
  "required_burn_x_efficiency": 0.204,
  "mdot_kg_s": 4.81,
  "jet_TW": 345.7,
  "pulse_hz": 250.0,
  "pellet_g": 19.2,
  "pulse_energy_TJ": 2.3,
  "pulse_kt_tnt": 0.55,
  "fusion_TW": 576.1,
  "burnup": 0.34,
  "nozzle_efficiency": 0.6,
  "neutron_TW": 17.3,
  "waste_heat_TW": 1.728395395120137,
  "verdict": "нужно, чтобы ~20% энергии топлива ушло в направленную струю — на грани «Дедала»; нейтроны D–D требуют теневой защиты"
 },
 "magsail": {
  "ship_mass_kt": 59.0,
  "v0_c": 0.1,
  "v1_c": 0.01,
  "years_target": 16,
  "variants": [
   {
    "n_ion_cm3": 0.1,
    "loop_km": 50.0,
    "moment_Am2": 8e+20,
    "current_MA": 101912.1,
    "wire_mass_kt": 20810.8
   },
   {
    "n_ion_cm3": 0.1,
    "loop_km": 200.0,
    "moment_Am2": 8e+20,
    "current_MA": 6369.5,
    "wire_mass_kt": 5202.7
   },
   {
    "n_ion_cm3": 0.1,
    "loop_km": 1000.0,
    "moment_Am2": 8e+20,
    "current_MA": 254.8,
    "wire_mass_kt": 1040.5
   },
   {
    "n_ion_cm3": 0.05,
    "loop_km": 50.0,
    "moment_Am2": 1.6e+21,
    "current_MA": 203824.3,
    "wire_mass_kt": 41621.6
   },
   {
    "n_ion_cm3": 0.05,
    "loop_km": 200.0,
    "moment_Am2": 1.6e+21,
    "current_MA": 12739.0,
    "wire_mass_kt": 10405.4
   },
   {
    "n_ion_cm3": 0.05,
    "loop_km": 1000.0,
    "moment_Am2": 1.6e+21,
    "current_MA": 509.6,
    "wire_mass_kt": 2081.1
   }
  ],
  "sketch_loop_km": 100,
  "sketch_mass_kt": 3,
  "sketch_current_MA": 7.35,
  "sketch_brake_years_n01": 3666,
  "sketch_brake_years_n005": 5820,
  "power_start_TW": 363.7,
  "magnetopause_start_km": 5069,
  "energy_dissipated_J": 2.63e+22,
  "verdict": "петля эскиза слишком лёгкая: для 16 лет нужен парус в десятки тыс. т или петля в сотни км",
  "fixes": [
   {
    "what": "петля 1000 км, провод 50 тыс. т",
    "brake_years": 121
   },
   {
    "what": "петля 3000 км, провод 50 тыс. т",
    "brake_years": 58
   },
   {
    "what": "петля 3000 км, 50 тыс. т, старт торможения с 0,05c",
    "brake_years": 45
   }
  ]
 },
 "losses": {
  "capsule_years": 60116,
  "p_capsule_fail_per_year": 0.0002,
  "capsule_deaths": 12.0,
  "revivals": 2000,
  "p_revival": 0.004,
  "revival_deaths": 8.0,
  "awake_person_years": 6384,
  "p_accident": 0.0002,
  "accident_deaths": 1.3,
  "cancer_deaths": 37.3,
  "awake_dose_sv_per_year": 0.124,
  "total_expected": 58.6,
  "cancer_deaths_passive_3m_awake_only": 40.2,
  "cancer_basis": "базовый прогноз защиты XXVIII века",
  "sleeper_sv": 2.52,
  "awake_sv": 1.46,
  "risk_per_sv": 0.02
 },
 "light": {
  "E1_lux": 127000.0,
  "levels": [
   {
    "name": "пасмурный день",
    "lux": 10000,
    "au": 3.6,
    "years_at_0_1c": 0.09
   },
   {
    "name": "комната",
    "lux": 300,
    "au": 20.6,
    "years_at_0_1c": 0.23
   },
   {
    "name": "сумерки",
    "lux": 1,
    "au": 356.4,
    "years_at_0_1c": 0.95
   },
   {
    "name": "полная Луна",
    "lux": 0.25,
    "au": 712.7,
    "years_at_0_1c": 1.34
   },
   {
    "name": "ясная ночь без Луны",
    "lux": 0.001,
    "au": 11269.4,
    "years_at_0_1c": 5.34
   }
  ],
  "note": "после ~700 а.е. (~1,3 года разгона) Солнце светит слабее полной Луны — корабль освещают только свои огни"
 },
 "stage": {
  "dry_kt": 48.6,
  "KE_J": 2.2e+22,
  "KE_Mt": 5250000.0,
  "chicxulub_frac": 0.055,
  "no_divert": {
   "gap_km": 1656774,
   "sail_decel_ms2": 0.206,
   "catch_days": 1.5,
   "impact_kms": 26.1,
   "impact_Mt": 4.0
  },
  "divert": {
   "miss_au": 1000.0,
   "stage_years_to_target": 114.7,
   "dv_kms": 41.3,
   "tilt_deg": 10,
   "tilt_days": 5.1,
   "core_prop_t": 204,
   "core_burn_days": 13,
   "reserve_share_pct": 1.38,
   "lead_years": 10,
   "self_burn_safe_km": 2212043
  },
  "note": "ступень не может увести себя сама рядом с ядром: нейтроны её двигателя без теневого щита облучат экипаж; поэтому последние пять суток разгона тяга идёт под углом 10°, а ядро после отделения гасит боковую скорость своим двигателем"
 },
 "plasma_magnet": {
  "force_MN": 3.15,
  "decel_m_s2": 0.0534,
  "B0r0_Tm": 1.59,
  "B_antenna_T": 0.035,
  "antenna_r_m": 46.0,
  "rmp_start_km": 2584,
  "rmp_end_km": 25839,
  "rmp_start_km_n005": 3654,
  "power_start_TW": 94.5,
  "power_end_TW": 9.45,
  "energy_J": 2.63e+22,
  "halpha_start_MW": 5.7,
  "halpha_end_MW": 57.2,
  "halpha_surface_W_m2": 1.4e-07,
  "system_kt": 0.5,
  "wire_equiv_kt": 1040,
  "assumption": "токовый слой в плазме держится до десятков тысяч км; проверено лишь на метрах (лаборатория) и в моделях на десятки км",
  "note": "нейтральный газ сквозь пузырь проходит: фронтальный щит нужен и на торможении"
 },
 "radiation_forecast": {
  "spectrum": "LIS протонов Vos & Potgieter 2015, ядра с A/Z = 2; за экран проходят частицы с пробегом больше его толщины, их доза с вторичными растёт как (T/1 ГэВ)^k, k = 0,5, вилка k = 0…1",
  "cutoff_table": [
   {
    "BL_Tm": 0,
    "cutoff_GV": 0.0,
    "pass": 1.0,
    "pass_lo": 1.0,
    "pass_hi": 1.0
   },
   {
    "BL_Tm": 5,
    "cutoff_GV": 1.5,
    "pass": 0.965,
    "pass_lo": 0.943,
    "pass_hi": 0.983
   },
   {
    "BL_Tm": 10,
    "cutoff_GV": 3.0,
    "pass": 0.729,
    "pass_lo": 0.63,
    "pass_hi": 0.843
   },
   {
    "BL_Tm": 20,
    "cutoff_GV": 6.0,
    "pass": 0.353,
    "pass_lo": 0.209,
    "pass_hi": 0.568
   },
   {
    "BL_Tm": 40,
    "cutoff_GV": 12.0,
    "pass": 0.152,
    "pass_lo": 0.062,
    "pass_hi": 0.347
   },
   {
    "BL_Tm": 80,
    "cutoff_GV": 24.0,
    "pass": 0.063,
    "pass_lo": 0.018,
    "pass_hi": 0.204
   }
  ],
  "no_field_sleeper_sv": 20.1,
  "x_center_gcm2": 242,
  "passive_kt": 792,
  "scenarios": [
   {
    "name": "осторожный",
    "desc": "сверхпроводник 6 Тл, современные композиты; медицина лечит часть раков",
    "BL_Tm": 10,
    "B_T": 6,
    "cutoff_GV": 3.0,
    "pass_frac": 0.756,
    "vault_magnet": {
     "layer_m": 1.7,
     "energy_GJ": 414,
     "structure_t": 829,
     "conductor_t": 113,
     "mass_t": 941
    },
    "shelter_magnet": {
     "layer_m": 1.7,
     "energy_GJ": 125,
     "structure_t": 250,
     "conductor_t": 35,
     "mass_t": 285
    },
    "magnets_kt": 1.23,
    "sleeper_sv_120y": 15.21,
    "awake_sv_career": 3.2,
    "risk_per_sv": 0.03,
    "cancer_deaths": 254.2
   },
   {
    "name": "базовый",
    "desc": "сверхпроводник при комнатной температуре 10 Тл, волокна 10 МДж/кг; торпор и белки репарации",
    "BL_Tm": 20,
    "B_T": 10,
    "cutoff_GV": 6.0,
    "pass_frac": 0.417,
    "vault_magnet": {
     "layer_m": 2.0,
     "energy_GJ": 1388,
     "structure_t": 278,
     "conductor_t": 190,
     "mass_t": 468
    },
    "shelter_magnet": {
     "layer_m": 2.0,
     "energy_GJ": 420,
     "structure_t": 84,
     "conductor_t": 60,
     "mass_t": 144
    },
    "magnets_kt": 0.61,
    "sleeper_sv_120y": 2.52,
    "awake_sv_career": 1.46,
    "risk_per_sv": 0.02,
    "cancer_deaths": 37.3
   },
   {
    "name": "смелый",
    "desc": "поля 20 Тл, волокна 30 МДж/кг; редактирование генома репарации, рак излечим почти всегда",
    "BL_Tm": 40,
    "B_T": 20,
    "cutoff_GV": 12.0,
    "pass_frac": 0.236,
    "vault_magnet": {
     "layer_m": 2.0,
     "energy_GJ": 5550,
     "structure_t": 370,
     "conductor_t": 380,
     "mass_t": 750
    },
    "shelter_magnet": {
     "layer_m": 2.0,
     "energy_GJ": 1680,
     "structure_t": 112,
     "conductor_t": 120,
     "mass_t": 232
    },
    "magnets_kt": 0.98,
    "sleeper_sv_120y": 0.67,
    "awake_sv_career": 0.8,
    "risk_per_sv": 0.01,
    "cancer_deaths": 7.0
   }
  ],
  "bio": {
   "torpor": "опыты с синтетическим торпором у крыс (Болонья и GSI, 2019–2022): меньше повреждений от тяжёлых ионов",
   "dsup": "белок Dsup тихоходки снижает повреждения ДНК в клетках человека на ~40% (Hashimoto и др., 2016)"
  }
 }
};
