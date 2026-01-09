import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { AppState, AppAction, DetectedField, EncodingChannel, FieldType, AggregateType, TimeUnit, MarkType } from '../types';
import { detectAllFields } from '../utils/fieldDetection';
import carsData from '../../movies.json';

const initialState: AppState = {
  data: [],
  fields: [],
  encodings: {},
  markType: 'auto',
  chartTitle: null,
  isLoading: true,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, data: action.payload, isLoading: false };
    case 'SET_FIELDS':
      return { ...state, fields: action.payload };
    case 'ASSIGN_FIELD':
      return {
        ...state,
        encodings: {
          ...state.encodings,
          [action.channel]: {
            field: action.field,
            aggregate: null,
            timeUnit: action.field.type === 'temporal' ? 'year' : null
          }
        },
      };
    case 'REMOVE_FIELD': {
      const newEncodings = { ...state.encodings };
      delete newEncodings[action.channel];
      return { ...state, encodings: newEncodings };
    }
    case 'SET_AGGREGATE': {
      const existingConfig = state.encodings[action.channel];
      if (!existingConfig) return state;
      return {
        ...state,
        encodings: {
          ...state.encodings,
          [action.channel]: { ...existingConfig, aggregate: action.aggregate },
        },
      };
    }
    case 'SET_TIME_UNIT': {
      const existingConfig = state.encodings[action.channel];
      if (!existingConfig) return state;
      return {
        ...state,
        encodings: {
          ...state.encodings,
          [action.channel]: { ...existingConfig, timeUnit: action.timeUnit },
        },
      };
    }
    case 'CLEAR_ALL':
      return { ...state, encodings: {}, chartTitle: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'TOGGLE_FIELD_TYPE': {
      const newFields = state.fields.map((field) => {
        if (field.name === action.fieldName) {
          // Toggle between ordinal and nominal
          const newType: FieldType = field.type === 'ordinal' ? 'nominal' : 'ordinal';
          return { ...field, type: newType };
        }
        return field;
      });
      // Also update any encodings that use this field
      const newEncodings = { ...state.encodings };
      for (const [channel, config] of Object.entries(newEncodings)) {
        if (config && config.field.name === action.fieldName) {
          const newType: FieldType = config.field.type === 'ordinal' ? 'nominal' : 'ordinal';
          newEncodings[channel as EncodingChannel] = {
            ...config,
            field: { ...config.field, type: newType }
          };
        }
      }
      return { ...state, fields: newFields, encodings: newEncodings };
    }
    case 'RESET_FOR_NEW_DATA':
      return {
        ...state,
        data: [],
        fields: [],
        encodings: {},
        markType: 'auto',
        chartTitle: null,
        isLoading: true,
        error: null,
      };
    case 'SET_MARK_TYPE':
      return { ...state, markType: action.markType };
    case 'SET_CHART_TITLE':
      return { ...state, chartTitle: action.title };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  assignField: (channel: EncodingChannel, field: DetectedField) => void;
  removeField: (channel: EncodingChannel) => void;
  setAggregate: (channel: EncodingChannel, aggregate: AggregateType) => void;
  setTimeUnit: (channel: EncodingChannel, timeUnit: TimeUnit) => void;
  setMarkType: (markType: MarkType) => void;
  setChartTitle: (title: string | null) => void;
  clearAll: () => void;
  toggleFieldType: (fieldName: string) => void;
  loadData: (data: Record<string, unknown>[]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const data = carsData as Record<string, unknown>[];
      dispatch({ type: 'SET_DATA', payload: data });
      const fields = detectAllFields(data);
      dispatch({ type: 'SET_FIELDS', payload: fields });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      console.error(err);
    }
  }, []);

  const assignField = (channel: EncodingChannel, field: DetectedField) => {
    dispatch({ type: 'ASSIGN_FIELD', channel, field });
  };

  const removeField = (channel: EncodingChannel) => {
    dispatch({ type: 'REMOVE_FIELD', channel });
  };

  const setAggregate = (channel: EncodingChannel, aggregate: AggregateType) => {
    dispatch({ type: 'SET_AGGREGATE', channel, aggregate });
  };

  const setTimeUnit = (channel: EncodingChannel, timeUnit: TimeUnit) => {
    dispatch({ type: 'SET_TIME_UNIT', channel, timeUnit });
  };

  const setMarkType = (markType: MarkType) => {
    dispatch({ type: 'SET_MARK_TYPE', markType });
  };

  const setChartTitle = (title: string | null) => {
    dispatch({ type: 'SET_CHART_TITLE', title });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const toggleFieldType = (fieldName: string) => {
    dispatch({ type: 'TOGGLE_FIELD_TYPE', fieldName });
  };

  const loadData = (data: Record<string, unknown>[]) => {
    dispatch({ type: 'RESET_FOR_NEW_DATA' });
    try {
      dispatch({ type: 'SET_DATA', payload: data });
      const fields = detectAllFields(data);
      dispatch({ type: 'SET_FIELDS', payload: fields });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process uploaded data' });
      console.error(err);
    }
  };

  return (
    <AppContext.Provider value={{ state, assignField, removeField, setAggregate, setTimeUnit, setMarkType, setChartTitle, clearAll, toggleFieldType, loadData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
