import React from 'react';
import {
  Box,
  Button,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  DAY_LABELS,
  ScheduleRowForm,
  copyFirstDayToAll,
  scheduleRowHint,
  validateScheduleRows,
} from '../../admin/utils/marketplaceForms';

interface OpeningHoursEditorProps {
  rows: ScheduleRowForm[];
  onChange: (rows: ScheduleRowForm[]) => void;
  /** Show per-row errors (after a save attempt). */
  showErrors?: boolean;
}

/**
 * One row per day, Mon..Sun (D15): an "Open" switch, then open and close
 * times (24h "HH:mm", India time). Close before open = after midnight.
 */
const OpeningHoursEditor: React.FC<OpeningHoursEditorProps> = ({
  rows,
  onChange,
  showErrors = false,
}) => {
  const rowErrors = showErrors ? validateScheduleRows(rows) : [];

  const updateRow = (index: number, patch: Partial<ScheduleRowForm>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <Stack spacing={1}>
      {rows.map((row, index) => {
        const hint = scheduleRowHint(row);
        const error = rowErrors[index];
        return (
          <Box key={row.day}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ width: 36, fontWeight: 600 }}>
                {DAY_LABELS[row.day]}
              </Typography>
              <Switch
                size="small"
                checked={!row.closed}
                onChange={(e) =>
                  updateRow(index, { closed: !e.target.checked })
                }
                inputProps={{ 'aria-label': `${DAY_LABELS[row.day]} open` }}
              />
              {row.closed ? (
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Closed
                </Typography>
              ) : (
                <>
                  <TextField
                    type="time"
                    size="small"
                    value={row.open}
                    onChange={(e) => updateRow(index, { open: e.target.value })}
                    error={Boolean(error)}
                    inputProps={{
                      step: 300,
                      'aria-label': `${DAY_LABELS[row.day]} opens`,
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <Typography color="text.secondary">–</Typography>
                  <TextField
                    type="time"
                    size="small"
                    value={row.close}
                    onChange={(e) =>
                      updateRow(index, { close: e.target.value })
                    }
                    error={Boolean(error)}
                    inputProps={{
                      step: 300,
                      'aria-label': `${DAY_LABELS[row.day]} closes`,
                    }}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                </>
              )}
            </Stack>
            {(error || hint) && (
              <Typography
                variant="caption"
                color={error ? 'error' : 'text.secondary'}
                sx={{ display: 'block', pl: '96px' }}
              >
                {error ?? hint}
              </Typography>
            )}
          </Box>
        );
      })}
      <Box>
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={() => onChange(copyFirstDayToAll(rows))}
        >
          Copy Monday to all days
        </Button>
      </Box>
    </Stack>
  );
};

export default OpeningHoursEditor;
