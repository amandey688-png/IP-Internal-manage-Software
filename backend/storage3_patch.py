"""
Temporary patch for storage3 to avoid pyroaring dependency.
This allows supabase to import storage3 without requiring C++ build tools.
"""

import sys
from unittest.mock import MagicMock

# Create a mock storage3 module
storage3_mock = MagicMock()
storage3_mock.utils = MagicMock()
storage3_mock.utils.StorageException = Exception

# Inject into sys.modules before supabase tries to import it
sys.modules['storage3'] = storage3_mock
sys.modules['storage3.utils'] = storage3_mock.utils
