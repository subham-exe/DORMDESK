export type Role = 'Student' | 'Warden' | 'Admin' | 'Faculty' | 'Staff';
export type Domain = 'Request' | 'Incident' | 'Scholarship' | 'User';
export type Scope = 'Own' | 'Hostel' | 'Department' | 'Any';
export type Permission = 'Create' | 'Read' | 'Update' | 'Delete' | 'Assign' | 'Approve' | 'Verify';

export type PolicyMatrix = {
  [R in Role]?: {
    [D in Domain]?: {
      [P in Permission]?: Scope[];
    };
  };
};

export const ROLE_POLICIES: PolicyMatrix = {
  Student: {
    Request: { Create: ['Own'], Read: ['Own'], Update: ['Own'] },
    Scholarship: { Read: ['Own'], Create: ['Own'] },
    User: { Read: ['Own'], Update: ['Own'] }
  },
  Warden: {
    Request: { Read: ['Hostel', 'Own'], Approve: ['Hostel'], Assign: ['Hostel'] },
    Incident: { Read: ['Hostel', 'Own'], Create: ['Hostel'] },
    User: { Read: ['Hostel', 'Own'] }
  },
  Admin: {
    Request: { Create: ['Any'], Read: ['Any'], Update: ['Any'], Delete: ['Any'], Assign: ['Any'], Approve: ['Any'], Verify: ['Any'] },
    Incident: { Create: ['Any'], Read: ['Any'], Update: ['Any'], Delete: ['Any'], Assign: ['Any'], Approve: ['Any'], Verify: ['Any'] },
    Scholarship: { Create: ['Any'], Read: ['Any'], Update: ['Any'], Delete: ['Any'], Assign: ['Any'], Approve: ['Any'], Verify: ['Any'] },
    User: { Create: ['Any'], Read: ['Any'], Update: ['Any'], Delete: ['Any'], Assign: ['Any'], Approve: ['Any'], Verify: ['Any'] }
  },
  Faculty: {
    Request: { Read: ['Department', 'Own'], Approve: ['Department'] },
    User: { Read: ['Department', 'Own'] }
  },
  Staff: {
    Request: { Read: ['Department', 'Own'], Update: ['Department'] },
    Incident: { Read: ['Department', 'Own'], Update: ['Department'] }
  }
};
