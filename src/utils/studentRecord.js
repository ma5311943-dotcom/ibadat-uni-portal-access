const FIELD_ALIASES = {
  name: [
    'name',
    'studentName',
    'student_name',
    'fullName',
    'full_name',
    'studentFullName',
    'student_full_name',
    'displayName',
    'display_name',
  ],
  registrationNumber: [
    'registrationNumber',
    'registration_number',
    'registrationNo',
    'registration_no',
    'regNumber',
    'reg_number',
    'regNo',
    'reg_no',
    'registration',
    'registrationId',
    'registration_id',
    'rollNumber',
    'roll_number',
    'rollNo',
    'roll_no',
    'enrollmentNumber',
    'enrollment_number',
    'enrollmentNo',
    'enrollment_no',
    'regdNo',
    'regd_no',
  ],
  department: [
    'department',
    'departmentName',
    'department_name',
    'dept',
    'deptName',
    'dept_name',
    'branch',
    'branchName',
    'branch_name',
    'discipline',
  ],
  semester: [
    'semester',
    'semesterName',
    'semester_name',
    'semesterNumber',
    'semester_number',
    'currentSemester',
    'current_semester',
    'sem',
  ],
  session: [
    'session',
    'sessionName',
    'session_name',
    'academicSession',
    'academic_session',
    'currentSession',
    'current_session',
  ],
  status: [
    'status',
    'studentStatus',
    'student_status',
    'enrollmentStatus',
    'enrollment_status',
    'currentStatus',
    'current_status',
    'academicStatus',
    'academic_status',
  ],
  email: [
    'email',
    'emailAddress',
    'email_address',
    'studentEmail',
    'student_email',
    'collegeEmail',
    'college_email',
  ],
  phone: [
    'phone',
    'phoneNumber',
    'phone_number',
    'mobile',
    'mobileNumber',
    'mobile_number',
    'contact',
    'contactNumber',
    'contact_number',
  ],
  cgpa: ['cgpa', 'gpa', 'sgpa', 'currentCgpa', 'current_cgpa'],
  section: ['section', 'sec', 'sectionName', 'section_name'],
  batch: [
    'batch',
    'batchYear',
    'batch_year',
    'admissionYear',
    'admission_year',
    'academicYear',
    'academic_year',
    'year',
  ],
  gender: ['gender', 'sex'],
  dateOfBirth: [
    'dateOfBirth',
    'date_of_birth',
    'dob',
    'birthDate',
    'birth_date',
  ],
  bloodGroup: ['bloodGroup', 'blood_group', 'bloodgroup'],
  address: [
    'address',
    'permanentAddress',
    'permanent_address',
    'currentAddress',
    'current_address',
  ],
  guardianName: [
    'guardianName',
    'guardian_name',
    'fatherName',
    'father_name',
    'parentName',
    'parent_name',
  ],
  photoUrl: [
    'photoUrl',
    'photo_url',
    'photo',
    'profilePhoto',
    'profile_photo',
    'profileImage',
    'profile_image',
    'avatar',
    'image',
  ],
};

const NAME_PART_ALIASES = {
  firstName: ['firstName', 'first_name', 'givenName', 'given_name'],
  middleName: ['middleName', 'middle_name'],
  lastName: [
    'lastName',
    'last_name',
    'surname',
    'familyName',
    'family_name',
  ],
};

const WRAPPER_KEYS = [
  'data',
  'student',
  'studentData',
  'student_data',
  'result',
  'record',
  'records',
  'details',
  'response',
  'payload',
];

const NESTED_CONTAINER_KEYS = [
  'details',
  'studentDetails',
  'student_details',
  'profileDetails',
  'profile_details',
  'personalDetails',
  'personal_details',
  'academicDetails',
  'academic_details',
  'contactDetails',
  'contact_details',
  'contactInfo',
  'contact_info',
];

const STRONG_FIELDS = [
  'name',
  'registrationNumber',
  'department',
  'semester',
];

const META_KEYS = new Set([
  'success',
  'message',
  'error',
  'errors',
  'statusCode',
  'status_code',
  'timestamp',
  'meta',
  'pagination',
  'count',
  'total',
  'page',
  'limit',
  'requestId',
  'request_id',
  'id',
  '_id',
  '__v',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
]);

const LABEL_OVERRIDES = {
  cgpa: 'CGPA',
  sgpa: 'SGPA',
  gpa: 'GPA',
  dob: 'Date of Birth',
  id: 'ID',
  regdNo: 'Registration No',
};

const MAX_DETAIL_LENGTH = 320;
const ALL_ALIASES = {
  ...FIELD_ALIASES,
  ...NAME_PART_ALIASES,
};
const RESERVED_NORMALIZED_KEYS = new Set(
  Object.values(ALL_ALIASES)
    .flat()
    .map(normalizeKey),
);
const STRONG_NORMALIZED_KEYS = STRONG_FIELDS.map((field) =>
  FIELD_ALIASES[field].map(normalizeKey),
).flat();
const WRAPPER_NORMALIZED_KEYS = WRAPPER_KEYS.map(normalizeKey);
const NESTED_CONTAINER_NORMALIZED_KEYS = new Set(
  NESTED_CONTAINER_KEYS.map(normalizeKey),
);
const META_NORMALIZED_KEYS = new Set(
  Array.from(META_KEYS).map(normalizeKey),
);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(key) {
  return String(key)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isDisplayable(value) {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(isDisplayable);
  }

  if (isObject(value)) {
    return Object.keys(value).length > 0;
  }

  return false;
}

function truncate(value) {
  if (value.length <= MAX_DETAIL_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_DETAIL_LENGTH - 1).trimEnd()}…`;
}

function humanizeLabel(key) {
  if (LABEL_OVERRIDES[key]) {
    return LABEL_OVERRIDES[key];
  }

  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildKeyLookup(record) {
  const lookup = new Map();

  Object.keys(record).forEach((key) => {
    lookup.set(normalizeKey(key), key);
  });

  return lookup;
}

function findOriginalKey(lookup, alias) {
  return lookup.get(normalizeKey(alias));
}

function pickField(record, lookup, field) {
  const aliases = ALL_ALIASES[field] || [];

  for (const alias of aliases) {
    const originalKey = findOriginalKey(lookup, alias);

    if (originalKey === undefined) {
      continue;
    }

    if (isDisplayable(record[originalKey])) {
      return record[originalKey];
    }
  }

  return null;
}

function toText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    const parts = value.map(toText).filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }

  if (isObject(value)) {
    const preferredKeys = [
      'name',
      'title',
      'label',
      'value',
      'displayName',
      'display_name',
      'code',
      'description',
    ];

    for (const key of preferredKeys) {
      const text = toText(value[key]);

      if (text) {
        return text;
      }
    }
  }

  return null;
}

function formatDetailValue(value) {
  const text = toText(value);

  if (text) {
    return truncate(text);
  }

  if (Array.isArray(value)) {
    return null;
  }

  if (isObject(value)) {
    const parts = Object.entries(value)
      .map(([key, childValue]) => {
        const childText = toText(childValue);
        return childText ? `${humanizeLabel(key)}: ${childText}` : null;
      })
      .filter(Boolean);

    return parts.length > 0 ? truncate(parts.join(' · ')) : null;
  }

  return null;
}

function hasStrongFields(record, normalizedKeys) {
  if (STRONG_NORMALIZED_KEYS.some((key) => normalizedKeys.has(key))) {
    return true;
  }

  const knownFieldCount = Array.from(normalizedKeys).filter((key) =>
    RESERVED_NORMALIZED_KEYS.has(key),
  ).length;

  return knownFieldCount >= 2;
}

function unwrapRecord(payload) {
  let current = payload;

  for (let depth = 0; depth < 7; depth += 1) {
    if (Array.isArray(current)) {
      if (current.length === 0) {
        return null;
      }

      current = current[0];
      continue;
    }

    if (!isObject(current)) {
      return null;
    }

    const lookup = buildKeyLookup(current);
    const normalizedKeys = new Set(lookup.keys());

    if (hasStrongFields(current, normalizedKeys)) {
      return current;
    }

    const wrapperKey = WRAPPER_NORMALIZED_KEYS.map((key) =>
      lookup.get(key),
    ).find((key) => {
      if (!key) {
        return false;
      }

      return isObject(current[key]) || Array.isArray(current[key]);
    });

    if (!wrapperKey) {
      return current;
    }

    current = current[wrapperKey];
  }

  return isObject(current) ? current : null;
}

function flattenNestedContainers(record) {
  const flatRecord = { ...record };
  const existingKeys = new Set(
    Object.keys(flatRecord).map((key) => normalizeKey(key)),
  );

  Object.entries(record).forEach(([key, value]) => {
    if (
      !NESTED_CONTAINER_NORMALIZED_KEYS.has(normalizeKey(key)) ||
      !isObject(value)
    ) {
      return;
    }

    delete flatRecord[key];

    Object.entries(value).forEach(([childKey, childValue]) => {
      const normalizedChildKey = normalizeKey(childKey);

      if (existingKeys.has(normalizedChildKey)) {
        return;
      }

      flatRecord[childKey] = childValue;
      existingKeys.add(normalizedChildKey);
    });
  });

  return flatRecord;
}

function collectExtraDetails(record) {
  return Object.entries(record)
    .filter(([key, value]) => {
      const normalizedKey = normalizeKey(key);

      return (
        !RESERVED_NORMALIZED_KEYS.has(normalizedKey) &&
        !META_NORMALIZED_KEYS.has(normalizedKey) &&
        isDisplayable(value)
      );
    })
    .map(([key, value]) => ({
      label: humanizeLabel(key),
      value: formatDetailValue(value),
    }))
    .filter((detail) => Boolean(detail.value));
}

function getPhotoUrl(value) {
  const text = toText(value);

  if (!text || !/^https?:\/\//i.test(text)) {
    return null;
  }

  return text;
}

export function normalizeStudentRecord(payload, requestedRegistration) {
  const rawRecord = unwrapRecord(payload);

  if (!rawRecord) {
    return null;
  }

  const record = flattenNestedContainers(rawRecord);
  const lookup = buildKeyLookup(record);
  const directName = toText(pickField(record, lookup, 'name'));
  const firstName = toText(pickField(record, lookup, 'firstName'));
  const middleName = toText(pickField(record, lookup, 'middleName'));
  const lastName = toText(pickField(record, lookup, 'lastName'));
  const nameParts = [firstName, middleName, lastName].filter(Boolean);
  const name = directName || (nameParts.length > 0 ? nameParts.join(' ') : null);

  const actualRegistration = toText(
    pickField(record, lookup, 'registrationNumber'),
  );
  const department = toText(pickField(record, lookup, 'department'));
  const semester = toText(pickField(record, lookup, 'semester'));
  const session = toText(pickField(record, lookup, 'session'));
  const status = toText(pickField(record, lookup, 'status'));
  const email = toText(pickField(record, lookup, 'email'));
  const phone = toText(pickField(record, lookup, 'phone'));
  const cgpa = toText(pickField(record, lookup, 'cgpa'));
  const section = toText(pickField(record, lookup, 'section'));
  const batch = toText(pickField(record, lookup, 'batch'));
  const gender = toText(pickField(record, lookup, 'gender'));
  const dateOfBirth = toText(pickField(record, lookup, 'dateOfBirth'));
  const bloodGroup = toText(pickField(record, lookup, 'bloodGroup'));
  const address = toText(pickField(record, lookup, 'address'));
  const guardianName = toText(pickField(record, lookup, 'guardianName'));
  const photoUrl = getPhotoUrl(pickField(record, lookup, 'photoUrl'));
  const extraDetails = collectExtraDetails(record);

  const hasStudentData = Boolean(
    actualRegistration ||
      name ||
      department ||
      semester ||
      session ||
      status ||
      email ||
      phone ||
      cgpa ||
      section ||
      batch ||
      gender ||
      dateOfBirth ||
      bloodGroup ||
      address ||
      guardianName ||
      photoUrl ||
      extraDetails.length > 0,
  );

  if (!hasStudentData) {
    return null;
  }

  return {
    raw: rawRecord,
    name,
    registrationNumber:
      actualRegistration || String(requestedRegistration || '').trim() || null,
    department,
    semester,
    session,
    status,
    email,
    phone,
    cgpa,
    section,
    batch,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    guardianName,
    photoUrl,
    extraDetails,
  };
}
