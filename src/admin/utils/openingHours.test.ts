import { describe, expect, it } from 'vitest';
import { DaySchedule, RestaurantAdmin } from '../types/marketplace';
import {
  copyFirstDayToAll,
  defaultScheduleRows,
  emptyRestaurantForm,
  isValidTime,
  restaurantFormToRequest,
  restaurantOpenStatus,
  restaurantToForm,
  scheduleError,
  scheduleRowHint,
  scheduleRowsToRequest,
  scheduleToRows,
  validateRestaurantForm,
  validateScheduleRows,
} from './marketplaceForms';

const restaurant = (
  overrides: Partial<RestaurantAdmin> = {}
): RestaurantAdmin => ({
  id: 'mutka-king',
  name: 'Mutka King',
  slug: 'mutka-king',
  marketId: 'market1',
  phone: '+919800000000',
  commissionPercent: 0,
  discountSharePercent: 0,
  active: true,
  displayOrder: 2,
  ...overrides,
});

const week = (entry: Partial<DaySchedule> = {}): DaySchedule[] =>
  defaultScheduleRows().map((row) => ({ ...row, ...entry }));

describe('schedule rows', () => {
  it('defaults to every day open 11:00–23:00, Mon..Sun', () => {
    const rows = defaultScheduleRows();
    expect(rows.map((r) => r.day)).toEqual([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]);
    expect(rows.every((r) => r.open === '11:00' && r.close === '23:00')).toBe(
      true
    );
    expect(rows.some((r) => r.closed)).toBe(false);
  });

  it('orders a stored schedule Mon..Sun and fills missing days', () => {
    const rows = scheduleToRows([
      { day: 'SUNDAY', open: '10:00', close: '23:30', closed: false },
      { day: 'TUESDAY', open: '11:00', close: '23:00', closed: true },
    ]);
    expect(rows[0]).toEqual({
      day: 'MONDAY',
      open: '11:00',
      close: '23:00',
      closed: false,
    });
    expect(rows[1].closed).toBe(true);
    expect(rows[6]).toEqual({
      day: 'SUNDAY',
      open: '10:00',
      close: '23:30',
      closed: false,
    });
    expect(scheduleToRows(null)).toEqual(defaultScheduleRows());
  });

  it('copies Monday to all days', () => {
    const rows = defaultScheduleRows();
    rows[0] = { ...rows[0], open: '18:00', close: '02:00' };
    rows[3] = { ...rows[3], closed: true };
    const copied = copyFirstDayToAll(rows);
    expect(
      copied.every(
        (r) => r.open === '18:00' && r.close === '02:00' && !r.closed
      )
    ).toBe(true);
    expect(copied.map((r) => r.day)).toEqual(rows.map((r) => r.day));
    expect(copyFirstDayToAll([])).toEqual([]);
  });

  it('hints overnight and 24-hour days', () => {
    const base = defaultScheduleRows()[0];
    expect(scheduleRowHint({ ...base, open: '18:00', close: '02:00' })).toBe(
      'Closes after midnight'
    );
    expect(scheduleRowHint({ ...base, open: '00:00', close: '00:00' })).toBe(
      '24 hours'
    );
    expect(scheduleRowHint(base)).toBeNull();
    expect(
      scheduleRowHint({ ...base, closed: true, open: '18:00', close: '02:00' })
    ).toBeNull();
  });
});

describe('schedule validation', () => {
  it('accepts only 24h HH:mm', () => {
    expect(isValidTime('00:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:00')).toBe(false);
    expect(isValidTime('')).toBe(false);
  });

  it('flags bad times on open days only', () => {
    const rows = defaultScheduleRows();
    rows[1] = { ...rows[1], open: '' };
    rows[2] = { ...rows[2], close: '25:00' };
    rows[3] = { ...rows[3], open: '', closed: true };
    expect(validateScheduleRows(rows)).toEqual([
      undefined,
      'Open time must be HH:mm',
      'Close time must be HH:mm',
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(scheduleError(rows)).toBe('Tue: Open time must be HH:mm');
  });

  it('needs all 7 days exactly once', () => {
    const rows = defaultScheduleRows();
    expect(scheduleError(rows)).toBeUndefined();
    expect(scheduleError(rows.slice(0, 6))).toMatch(/every day/);
    expect(scheduleError([...rows.slice(0, 6), { ...rows[0] }])).toMatch(
      /every day/
    );
  });

  it('only validates the schedule when hours are on', () => {
    const values = {
      ...emptyRestaurantForm('market1'),
      name: 'Mutka King',
      phone: '+91',
    };
    values.schedule = values.schedule.map((r) => ({ ...r, open: 'x' }));
    expect(validateRestaurantForm(values).schedule).toBeUndefined();
    expect(
      validateRestaurantForm({ ...values, hoursEnabled: true }).schedule
    ).toBe('Mon: Open time must be HH:mm');
  });

  it('replaces bad times on closed days when building the request', () => {
    const rows = defaultScheduleRows();
    rows[6] = { ...rows[6], closed: true, open: '', close: '' };
    expect(scheduleRowsToRequest(rows)[6]).toEqual({
      day: 'SUNDAY',
      open: '11:00',
      close: '23:00',
      closed: true,
    });
  });
});

describe('weeklySchedule null semantics (D15)', () => {
  const form = () => ({
    ...emptyRestaurantForm('market1'),
    name: 'Mutka King',
    phone: '+91',
  });

  it('CREATE with hours off sends weeklySchedule: null (always open)', () => {
    const request = restaurantFormToRequest(form(), { isCreate: true });
    expect(request).toHaveProperty('weeklySchedule', null);
    expect(request.acceptingOrders).toBe(true);
  });

  it('EDIT with hours off omits weeklySchedule (server keeps it)', () => {
    const request = restaurantFormToRequest(form());
    expect('weeklySchedule' in request).toBe(false);
  });

  it('hours on sends the 7-day schedule (create and edit)', () => {
    const values = { ...form(), hoursEnabled: true };
    expect(
      restaurantFormToRequest(values, { isCreate: true }).weeklySchedule
    ).toEqual(week());
    expect(restaurantFormToRequest(values).weeklySchedule).toEqual(week());
  });

  it('round-trips a stored schedule and keeps the editor locked on', () => {
    const stored = week();
    stored[1] = { ...stored[1], closed: true };
    stored[4] = { ...stored[4], open: '18:00', close: '02:00' };
    const values = restaurantToForm(restaurant({ weeklySchedule: stored }));
    expect(values.hoursEnabled).toBe(true);
    expect(values.hasStoredSchedule).toBe(true);
    expect(restaurantFormToRequest(values).weeklySchedule).toEqual(stored);
  });

  it('a restaurant without a schedule stays without one on edit', () => {
    const values = restaurantToForm(restaurant({ weeklySchedule: null }));
    expect(values.hoursEnabled).toBe(false);
    expect(values.hasStoredSchedule).toBe(false);
    expect('weeklySchedule' in restaurantFormToRequest(values)).toBe(false);
  });

  it('round-trips acceptingOrders (missing = true)', () => {
    expect(
      restaurantFormToRequest(
        restaurantToForm(restaurant({ acceptingOrders: false }))
      ).acceptingOrders
    ).toBe(false);
    expect(
      restaurantFormToRequest(restaurantToForm(restaurant())).acceptingOrders
    ).toBe(true);
  });
});

describe('restaurantOpenStatus', () => {
  it('shows Open now, Closed with the next opening, or Paused', () => {
    expect(restaurantOpenStatus(restaurant({ openNow: true }))).toEqual({
      label: 'Open now',
      color: 'success',
    });
    expect(
      restaurantOpenStatus(
        restaurant({
          openNow: false,
          closedReason: 'SCHEDULE',
          nextOpensLabel: 'Opens tomorrow at 11:00 AM',
        })
      )
    ).toEqual({
      label: 'Closed · Opens tomorrow at 11:00 AM',
      color: 'default',
    });
    expect(
      restaurantOpenStatus(
        restaurant({ openNow: false, nextOpensLabel: 'Closed' })
      )?.label
    ).toBe('Closed');
    expect(
      restaurantOpenStatus(
        restaurant({
          openNow: false,
          acceptingOrders: false,
          closedReason: 'PAUSED',
          nextOpensLabel: 'Not accepting orders right now',
        })
      )
    ).toEqual({ label: 'Paused', color: 'warning' });
  });

  it('shows nothing for inactive restaurants or an older server', () => {
    expect(
      restaurantOpenStatus(restaurant({ active: false, openNow: false }))
    ).toBeNull();
    expect(restaurantOpenStatus(restaurant())).toBeNull();
  });
});
