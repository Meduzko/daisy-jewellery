// "use client";

// import { useState, useEffect } from 'react';
// import { TextField, Autocomplete, CircularProgress } from '@mui/material';

// const DepartmentAutocomplete = ({ cityName, handleChange, error, helperText }) => {
//   const [open, setOpen] = useState(false);
//   const [options, setOptions] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [inputValue, setInputValue] = useState('');

//   const onChange = (e, value) => {
//     handleChange(e, 'department', value?.Description)
//   };

//   const fetchDepartments = async (query = '') => {
//     setLoading(true);
//     try {
//       const response = await fetch(`/api/novaposhta?cityName=${cityName}&search=${query}`);
//       if (!response.ok) {
//         throw new Error('Failed to fetch cities');
//       }
//       const data = await response.json();
//       setOptions(data || []);
//     } catch (error) {
//       console.error('Error fetching cities:', error);
//       setOptions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (open) {
//       fetchDepartments();
//     }
//   }, [open]);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       if (inputValue.length >= 2) {
//         fetchDepartments(inputValue);
//       }
//     }, 500);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [inputValue]);

//   return (
//     <Autocomplete
//       id="department-autocomplete"
//       open={open}
//       onOpen={() => setOpen(true)}
//       onClose={() => setOpen(false)}
//       isOptionEqualToValue={(option, value) => option.Ref === value.Ref}
//       getOptionLabel={(option) => option.Description || ''}
//       options={options}
//       loading={loading}
//       onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
//       onChange={onChange}
//       freeSolo={true}
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           label="Відділення нової пошти"
//           error={error}
//           helperText={helperText}
//           required
//           InputProps={{
//             ...params.InputProps,
//             endAdornment: (
//               <>
//                 {loading ? <CircularProgress color="inherit" size={20} /> : null}
//                 {params.InputProps.endAdornment}
//               </>
//             ),
//           }}
//         />
//       )}
//     />
//   );
// };

// export default DepartmentAutocomplete;


"use client";

import { useState, useEffect } from 'react';
import { TextField, Autocomplete, CircularProgress } from '@mui/material';

const DepartmentAutocomplete = ({ cityName, handleChange, error, helperText }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  console.log('test');

  // Handle change from Autocomplete
  const onAutocompleteChange = (event, newValue) => {
    /**
     * In freeSolo mode, newValue can be:
     * 1) An object from the options array, or
     * 2) A string typed by the user, or
     * 3) null if cleared.
     *
     * We need to detect which case it is.
     */
    if (!newValue) {
      // User cleared the input
      handleChange(event, 'department', '');
    } else if (typeof newValue === 'string') {
      // The user typed text that doesn't match any option
      handleChange(event, 'department', newValue);
    } else {
      // The user selected an existing option
      handleChange(event, 'department', newValue.Description);
    }
  };

  // Triggered on *every* keystroke
  const onAutocompleteInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    // Report the typed text to parent
    handleChange(event, 'department', newInputValue);
  };

  const fetchDepartments = async (query = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/novaposhta?cityName=${cityName}&search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      setOptions(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dropdown opens the first time
  useEffect(() => {
    if (open) {
      // If there's already inputValue, use it; otherwise fetch all possible
      fetchDepartments(inputValue);
    }
  }, [open]);

  // Fetch filtered options as the user types (if >= 2 chars)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue.length >= 2) {
        fetchDepartments(inputValue);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  return (
    <Autocomplete
      id="department-autocomplete"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      /**
       * freeSolo allows entering any text that doesn't necessarily
       * match an existing option.
       */
      freeSolo
      // Ensure Autocomplete can compare option objects with selected value
      isOptionEqualToValue={(option, value) => option.Ref === value.Ref}
      // Determine what text to display in the input field
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.Description || ''
      }
      // The dropdown options
      options={options}
      loading={loading}
      // Keep track of what's typed
      // onInputChange={(event, newInputValue) => {
      //   setInputValue(newInputValue);
      // }}
      onInputChange={onAutocompleteInputChange}
      // Handle final selection or typed value
      onChange={onAutocompleteChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Відділення Нової Пошти"
          error={error}
          helperText={helperText}
          required
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default DepartmentAutocomplete;
