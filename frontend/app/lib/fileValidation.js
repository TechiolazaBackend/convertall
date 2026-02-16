function mimeMatches(fileMime, acceptRule) {
  if (!acceptRule) {
    return true;
  }

  if (acceptRule.endsWith('/*')) {
    const prefix = acceptRule.replace('/*', '');
    return fileMime.startsWith(`${prefix}/`);
  }

  return fileMime === acceptRule;
}

function extMatches(fileName, rule) {
  if (!rule.startsWith('.')) {
    return false;
  }

  return fileName.toLowerCase().endsWith(rule.toLowerCase());
}

export function validateFiles({ files, accept = [], maxFiles = 1, maxSizeMB = 100 }) {
  const picked = Array.from(files || []);

  if (maxFiles > 0 && picked.length > maxFiles) {
    return { valid: false, message: `You can upload up to ${maxFiles} file(s).` };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  for (const file of picked) {
    if (file.size > maxSizeBytes) {
      return { valid: false, message: `${file.name} is larger than ${maxSizeMB} MB.` };
    }

    if (accept.length > 0) {
      const matches = accept.some((rule) => mimeMatches(file.type || '', rule) || extMatches(file.name || '', rule));
      if (!matches) {
        return { valid: false, message: `${file.name} is not a supported file type.` };
      }
    }
  }

  return { valid: true, files: picked };
}
