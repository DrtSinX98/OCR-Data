// src/components/OcrTask.js - FINAL POLISHED VERSION WITH DENTAL/RETROFLEX SUPPORT
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Alert, Spinner, Container, Badge } from 'react-bootstrap';
import { getTaskDetail, submitCorrection } from '../services/api';

const OcrTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Advanced Odia Editor states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentWordStart, setCurrentWordStart] = useState(0);
  const [currentWordEnd, setCurrentWordEnd] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isTransliterationEnabled, setIsTransliterationEnabled] = useState(true);
  const [transliterationMethod, setTransliterationMethod] = useState('Enhanced Built-in');
  
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Initialize transliteration methods
  useEffect(() => {
    const checkMethods = async () => {
      try {
        const testGoogle = await transliterateWithGoogle('test');
        if (testGoogle && testGoogle.length > 0) {
          setTransliterationMethod('Google Input Tools + Enhanced');
          console.log('✅ Using Google Input Tools with enhanced built-in');
          return;
        }
      } catch (error) {
        console.log('Google Input Tools not available');
      }

      if (typeof window.Sanscript !== 'undefined') {
        setTransliterationMethod('Sanscript + Enhanced');
        console.log('✅ Using Sanscript with enhanced built-in');
        return;
      }

      setTransliterationMethod('Enhanced Built-in');
      console.log('✅ Using enhanced built-in transliteration');
    };

    checkMethods();
  }, []);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setError('Task ID not provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getTaskDetail(taskId);
        setTask(data.task);
        setCorrectedText(data.task.correctedText || data.task.ocrText || '');
        setError('');
      } catch (err) {
        console.error('Error fetching task:', err);
        setError(err.message || 'Failed to load task details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId]);

  // Google Input Tools API
  const transliterateWithGoogle = async (text) => {
    try {
      const response = await fetch('https://inputtools.google.com/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `text=${encodeURIComponent(text)}&ime=transliteration_en_or&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      });
      
      const data = await response.json();
      
      if (data && data[1] && data[1][0] && data[1][0][1] && data[1][0][1].length > 0) {
        return data[1][0][1];
      }
      
      return [];
    } catch (error) {
      console.warn('Google transliteration failed:', error);
      return [];
    }
  };

  // Generate dental/retroflex variants for ambiguous consonants
  const getDentalRetroflexVariants = (word) => {
    const variants = [];
    const lowerWord = word.toLowerCase();
    
    // Ambiguous consonants that have both dental and retroflex forms
    const ambiguousConsonants = [
      { dental: 'ta', retroflex: 'Ta', dentalChar: 'ତ', retroflexChar: 'ଟ' },
      { dental: 'tha', retroflex: 'Tha', dentalChar: 'ଥ', retroflexChar: 'ଠ' },
      { dental: 'da', retroflex: 'Da', dentalChar: 'ଦ', retroflexChar: 'ଡ' },
      { dental: 'dha', retroflex: 'Dha', dentalChar: 'ଧ', retroflexChar: 'ଢ' },
      { dental: 'na', retroflex: 'Na', dentalChar: 'ନ', retroflexChar: 'ଣ' },
      { dental: 'la', retroflex: 'La', dentalChar: 'ଲ', retroflexChar: 'ଳ' },
      { dental: 'sa', retroflex: 'Sa', dentalChar: 'ସ', retroflexChar: 'ଷ' },
    ];
    
    ambiguousConsonants.forEach(({ dental, retroflex, dentalChar, retroflexChar }) => {
      if (lowerWord === dental) {
        // For single consonant input, provide both dental and retroflex
        variants.push(dentalChar);      // Dental version (more common)
        variants.push(retroflexChar);   // Retroflex version
      } else if (lowerWord === retroflex.toLowerCase()) {
        // If user explicitly typed capital (retroflex), prefer retroflex first
        variants.push(retroflexChar);   // Retroflex version
        variants.push(dentalChar);      // Dental version
      }
    });
    
    return variants;
  };

  // Helper functions for suggestion labeling
  const getSourceColor = (suggestion, index) => {
    if (suggestion === 'ନ' || suggestion === 'ଣ' || suggestion === 'ତ' || suggestion === 'ଟ' || 
        suggestion === 'ଦ' || suggestion === 'ଡ' || suggestion === 'ସ' || suggestion === 'ଷ' ||
        suggestion === 'ଲ' || suggestion === 'ଳ' || suggestion === 'ଥ' || suggestion === 'ଠ' ||
        suggestion === 'ଧ' || suggestion === 'ଢ') {
      return '#ff6b35'; // Orange for dental/retroflex variants
    }
    return index === 0 ? '#1cc88a' : '#36b9cc';
  };

  const getSourceLabel = (suggestion, index) => {
    // Dental variants
    if (suggestion === 'ନ' || suggestion === 'ତ' || suggestion === 'ଦ' || 
        suggestion === 'ସ' || suggestion === 'ଲ' || suggestion === 'ଥ' || suggestion === 'ଧ') {
      return 'Dental';
    }
    // Retroflex variants
    if (suggestion === 'ଣ' || suggestion === 'ଟ' || suggestion === 'ଡ' || 
        suggestion === 'ଷ' || suggestion === 'ଳ' || suggestion === 'ଠ' || suggestion === 'ଢ') {
      return 'Retroflex';
    }
    return index === 0 ? 'AI' : index === 1 ? 'Enhanced' : 'Variant';
  };

  // Enhanced transliteration with comprehensive juktākṣara support
  const transliterateWord = useCallback(async (word) => {
    if (!word.trim() || word.length < 2) return [];
    
    const allSuggestions = [];
    const cleanWord = word.toLowerCase().trim();
    
    try {
      // Try Google Input Tools first
      try {
        const googleSuggestions = await transliterateWithGoogle(cleanWord);
        if (googleSuggestions.length > 0) {
          allSuggestions.push(...googleSuggestions.slice(0, 3));
          console.log('🟢 Google suggestions:', googleSuggestions);
        }
      } catch (error) {
        console.log('Google failed, trying other methods...');
      }

      // Use Sanscript if available
      if (typeof window.Sanscript !== 'undefined') {
        try {
          const base = window.Sanscript.t(cleanWord, "itrans", "oriya");
          if (base && base !== word && !allSuggestions.includes(base)) {
            allSuggestions.push(base);
          }
        } catch (error) {
          console.log('Sanscript failed');
        }
      }
      
      // Enhanced built-in with variations
      const builtInSuggestions = getEnhancedBuiltInSuggestions(cleanWord);
      builtInSuggestions.forEach(suggestion => {
        if (!allSuggestions.includes(suggestion)) {
          allSuggestions.push(suggestion);
        }
      });
      
      return allSuggestions.slice(0, 8); // More suggestions for dental/retroflex options
    } catch (error) {
      return getEnhancedBuiltInSuggestions(cleanWord);
    }
  }, []);

  // Enhanced built-in suggestions with dental/retroflex support
  const getEnhancedBuiltInSuggestions = (word) => {
    const suggestions = [];
    
    // First, check for dental/retroflex variants
    const dentalRetroflexVariants = getDentalRetroflexVariants(word);
    if (dentalRetroflexVariants.length > 0) {
      suggestions.push(...dentalRetroflexVariants);
    }
    
    // Direct word mapping
    const directTranslation = enhancedBuiltInTransliterate(word);
    if (directTranslation !== word && !suggestions.includes(directTranslation)) {
      suggestions.push(directTranslation);
    }
    
    // Generate other variations
    const variations = generateWordVariations(word);
    variations.forEach(variation => {
      const translated = enhancedBuiltInTransliterate(variation);
      if (translated !== word && !suggestions.includes(translated)) {
        suggestions.push(translated);
      }
    });
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  // Enhanced word variations with comprehensive dental/retroflex mappings
  const generateWordVariations = (word) => {
    const variations = [];
    
    // Comprehensive dental vs retroflex consonant mappings
    const consonantMaps = [
      // Dental ↔ Retroflex pairs
      { from: 'na', to: 'Na' }, { from: 'Na', to: 'na' },
      { from: 'ta', to: 'Ta' }, { from: 'Ta', to: 'ta' },
      { from: 'da', to: 'Da' }, { from: 'Da', to: 'da' },
      { from: 'dha', to: 'Dha' }, { from: 'Dha', to: 'dha' },
      { from: 'la', to: 'La' }, { from: 'La', to: 'la' },
      { from: 'sa', to: 'Sa' }, { from: 'Sa', to: 'sa' },
      { from: 'tha', to: 'Tha' }, { from: 'Tha', to: 'tha' },
      
      // Other common variations
      { from: 'sa', to: 'sha' }, { from: 'sha', to: 'sa' },
      { from: 'sha', to: 'Sa' }, { from: 'Sa', to: 'sha' },
      { from: 'ba', to: 'va' }, { from: 'va', to: 'ba' },
      { from: 'ya', to: 'Ya' }, { from: 'Ya', to: 'ya' },
    ];
    
    // Enhanced conjunct patterns
    const conjunctMaps = [
      { from: 'ksh', to: 'kSh' }, { from: 'kSh', to: 'ksh' },
      { from: 'gny', to: 'gy' }, { from: 'gy', to: 'gny' },
      { from: 'ntr', to: 'ntR' }, { from: 'ntR', to: 'ntr' },
      { from: 'sth', to: 'stH' }, { from: 'stH', to: 'sth' },
      
      // Dental/retroflex in conjuncts
      { from: 'nta', to: 'nTa' }, { from: 'nTa', to: 'nta' },
      { from: 'nda', to: 'nDa' }, { from: 'nDa', to: 'nda' },
      { from: 'nka', to: 'Nka' }, { from: 'Nka', to: 'nka' },
    ];
    
    // Apply all mappings
    [...consonantMaps, ...conjunctMaps].forEach(({ from, to }) => {
      if (word.toLowerCase().includes(from.toLowerCase())) {
        const variation = word.replace(new RegExp(from, 'gi'), to);
        if (variation !== word) {
          variations.push(variation);
        }
      }
    });
    
    // Vowel length variations
    const vowelVariations = [
      word.replace(/a(?![aeiou])/g, 'aa'),
      word.replace(/i(?![aeiou])/g, 'ii'),
      word.replace(/u(?![aeiou])/g, 'uu'),
      word.replace(/aa/g, 'a'),
      word.replace(/ii/g, 'i'),
      word.replace(/uu/g, 'u'),
    ];
    
    variations.push(...vowelVariations.filter(v => v !== word));
    
    return [...new Set(variations)]; // Remove duplicates
  };

  // Enhanced built-in transliteration with dental/retroflex variants
  const enhancedBuiltInTransliterate = (text) => {
    const lowerText = text.toLowerCase();
    
    const wordMap = {
      // Common greetings and phrases
      'namaskara': 'ନମସ୍କାର', 'namaskar': 'ନମସ୍କାର', 'namaskaara': 'ନମସ୍କାର',
      'bhala': 'ଭଲ', 'bhalo': 'ଭଲ',
      'dhanyabad': 'ଧନ୍ୟବାଦ', 'dhanyabaad': 'ଧନ୍ୟବାଦ', 'dhanyawaad': 'ଧନ୍ୟବାଦ',
      'kemiti': 'କେମିତି', 'kemite': 'କେମିତି',
      'aachen': 'ଆଛେନ୍', 'achhen': 'ଆଛେନ୍',
      
      // Personal pronouns
      'mu': 'ମୁଁ', 'mun': 'ମୁଁ', 'ami': 'ଆମି',
      'tume': 'ତୁମେ', 'tumhe': 'ତୁମେ', 'tumar': 'ତୁମର',
      'se': 'ସେ', 'sehi': 'ସେହି', 'taha': 'ତାହା',
      'aame': 'ଆମେ', 'aamara': 'ଆମର',
      
      // Places and objects
      'ghar': 'ଘର', 'school': 'ସ୍କୁଲ', 'college': 'କଲେଜ',
      'office': 'ଅଫିସ', 'hospital': 'ହସପିଟାଲ', 'market': 'ବଜାର',
      'pani': 'ପାଣି', 'bhaat': 'ଭାତ', 'tarkari': 'ତରକାରୀ',
      
      // SINGLE CONSONANTS - Dental variants (primary)
      'ka': 'କ', 'kha': 'ଖ', 'ga': 'ଗ', 'gha': 'ଘ', 'nga': 'ଙ',
      'cha': 'ଚ', 'chha': 'ଛ', 'ja': 'ଜ', 'jha': 'ଝ', 'nja': 'ଞ',
      'ta': 'ତ', 'tha': 'ଥ', 'da': 'ଦ', 'dha': 'ଧ', 'na': 'ନ',
      'pa': 'ପ', 'pha': 'ଫ', 'ba': 'ବ', 'bha': 'ଭ', 'ma': 'ମ',
      'ya': 'ଯ', 'ra': 'ର', 'la': 'ଲ', 'wa': 'ୱ', 'sha': 'ଶ',
      'sa': 'ସ', 'ha': 'ହ', 'ksha': 'କ୍ଷ', 'gya': 'ଜ୍ଞ',
      
      // RETROFLEX VARIANTS (using capital letters)
      'Ta': 'ଟ', 'Tha': 'ଠ', 'Da': 'ଡ', 'Dha': 'ଢ', 'Na': 'ଣ',
      'La': 'ଳ', 'Sa': 'ଷ',
      
      // Vowels
      'a': 'ଅ', 'aa': 'ଆ', 'i': 'ଇ', 'ii': 'ଈ', 'u': 'ଉ', 'uu': 'ଊ',
      'e': 'ଏ', 'o': 'ଓ', 'au': 'ଔ', 'ai': 'ଐ',
    };
    
    return wordMap[lowerText] || wordMap[text] || text;
  };

  // Get current word
  const getCurrentWord = (text, position) => {
    const words = text.split(/(\s+)/);
    let currentPos = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordStart = currentPos;
      const wordEnd = currentPos + word.length;
      
      if (position >= wordStart && position <= wordEnd && !/^\s+$/.test(word)) {
        return {
          word: word,
          start: wordStart,
          end: wordEnd,
          index: i
        };
      }
      currentPos = wordEnd;
    }
    return null;
  };

  // SIMPLIFIED TEXT CHANGE HANDLER
  const handleTextChange = useCallback(async (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setCorrectedText(value);
    setCursorPosition(cursorPos);
    
    if (!isTransliterationEnabled) {
      setShowSuggestions(false);
      return;
    }
    
    const currentWord = getCurrentWord(value, cursorPos);
    
    if (currentWord && currentWord.word.trim() && !/^\s+$/.test(currentWord.word)) {
      const word = currentWord.word.trim();
      
      if (!/[\u0B00-\u0B7F]/.test(word) && word.length > 0) { // Changed to > 0 for single characters
        console.log('🔍 Processing word for suggestions:', word);
        
        // Show loading state immediately
        setShowSuggestions(true);
        setSuggestions(['⏳ Loading suggestions...']);
        setCurrentWordStart(currentWord.start);
        setCurrentWordEnd(currentWord.end);
        
        try {
          const wordSuggestions = await transliterateWord(word);
          console.log('📝 Generated suggestions:', wordSuggestions);
          
          if (wordSuggestions.length > 0) {
            setSuggestions(wordSuggestions);
            setShowSuggestions(true);
          } else {
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Transliteration error:', error);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [isTransliterationEnabled, transliterateWord]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion) => {
    if (suggestion.includes('Loading')) return; // Ignore loading state
    
    const newText = correctedText.substring(0, currentWordStart) + suggestion + correctedText.substring(currentWordEnd);
    const newCursorPos = currentWordStart + suggestion.length;
    
    setCorrectedText(newText);
    setCursorPosition(newCursorPos);
    setShowSuggestions(false);
    
    const originalWord = correctedText.substring(currentWordStart, currentWordEnd);
    setMessage({ 
      text: `"${originalWord}" → "${suggestion}"`, 
      type: 'success' 
    });
    setTimeout(() => setMessage({ text: '', type: '' }), 1500);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [correctedText, currentWordStart, currentWordEnd]);

  // Keyboard events
  const handleKeyDown = useCallback((e) => {
    if (showSuggestions && suggestions.length > 0 && !suggestions[0].includes('Loading')) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[0]);
      }
    }
  }, [showSuggestions, suggestions, applySuggestion]);

  const toggleTransliteration = () => {
    setIsTransliterationEnabled(!isTransliterationEnabled);
    setShowSuggestions(false);
    setMessage({ 
      text: `Advanced transliteration ${!isTransliterationEnabled ? 'enabled' : 'disabled'}`, 
      type: 'info' 
    });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleSubmit = async () => {
    if (!correctedText.trim()) {
      setMessage({ text: 'Please provide corrected text before submitting.', type: 'danger' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: 'Submitting your correction...', type: 'info' });

    try {
      const data = await submitCorrection(taskId, correctedText);
      setMessage({ text: data.message || 'Correction submitted successfully!', type: 'success' });
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err) {
      console.error('Submit error:', err);
      setMessage({ text: err.message || 'Failed to submit correction. Please try again.', type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <Spinner animation="border" role="status" variant="primary" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="text-muted">Loading task details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center mt-5">
          <Alert variant="danger">
            <Alert.Heading>Error Loading Task</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={() => navigate('/home')}>
              <i className="material-icons me-2">home</i>
              Back to Home
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  if (!task) {
    return (
      <Container>
        <div className="text-center mt-5">
          <Alert variant="warning">
            <Alert.Heading>Task Not Found</Alert.Heading>
            <p>The requested task could not be found.</p>
            <Button variant="outline-warning" onClick={() => navigate('/home')}>
              <i className="material-icons me-2">home</i>
              Back to Home
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <div className="text-center mb-4">
        <h1 className="text-primary mb-2">OCR Task Correction</h1>
      </div>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}

      <Row>
        {/* Left side - Image */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="p-4">
              <Card.Title className="d-flex align-items-center gap-2 mb-3">
                <i className="material-icons">image</i>
                Original Image
              </Card.Title>
              <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                {task.imageUrl ? (
                  <img 
                    src={`http://localhost:5000${task.imageUrl}`} 
                    alt="OCR Task" 
                    className="img-fluid rounded shadow"
                    style={{ maxHeight: '500px' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      setMessage({ text: 'Failed to load image', type: 'danger' });
                    }}
                  />
                ) : (
                  <div className="text-center text-muted">
                    <i className="material-icons mb-3" style={{ fontSize: '4rem' }}>broken_image</i>
                    <p className="mb-0">No image available for this task.</p>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right side - Advanced Odia Editor */}
        <Col lg={6} className="mb-4">
          <Card className="h-100 shadow-sm border-0">
            <Card.Body className="p-4 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="d-flex align-items-center gap-2 mb-0">
                  <i className="material-icons">edit</i>
                  Advanced Odia Editor
                </Card.Title>
                <Button
                  variant={isTransliterationEnabled ? 'success' : 'outline-secondary'}
                  size="sm"
                  onClick={toggleTransliteration}
                  title={`Toggle advanced Odia transliteration (${transliterationMethod})`}
                >
                  <i className="material-icons me-1">translate</i>
                  {isTransliterationEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>

              {isTransliterationEnabled && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <strong>🚀 Advanced Odia Editor:</strong> Smart transliteration with dental/retroflex support
                    <Badge bg="primary" className="fs-6">
                      ({transliterationMethod})
                    </Badge>
                  </div>
                  <div className="d-flex gap-2 flex-wrap mb-2">
                    <Badge bg="light" text="dark">Type "na" → ନ (dental) or ଣ (retroflex)</Badge>
                    <Badge bg="light" text="dark">Type "ta" → ତ (dental) or ଟ (retroflex)</Badge>
                  </div>
                  <small className="d-block">
                    💡 Press Tab/Enter to apply • Escape to cancel • Now supports dental vs retroflex consonants for accurate Odia typing!
                  </small>
                </Alert>
              )}

              <div className="flex-fill">
                <textarea
                  ref={textareaRef}
                  className="form-control h-100"
                  value={correctedText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onSelect={(e) => {
                    setCursorPosition(e.target.selectionStart);
                  }}
                  placeholder="Start typing in English to see smart Odia suggestions with dental/retroflex support..."
                  style={{ 
                    fontFamily: 'Noto Sans Oriya, Arial, sans-serif',
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    resize: 'none'
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action buttons */}
      <div className="d-flex gap-3 justify-content-center mb-4">
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleSubmit} 
          disabled={isSubmitting || !correctedText.trim()}
          className="d-flex align-items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" />
              Submitting...
            </>
          ) : (
            <>
              <i className="material-icons">check</i>
              Submit Correction
            </>
          )}
        </Button>
        
        <Button 
          variant="outline-secondary" 
          size="lg"
          onClick={() => navigate('/home')}
          disabled={isSubmitting}
          className="d-flex align-items-center gap-2"
        >
          <i className="material-icons">home</i>
          Back to Home
        </Button>
      </div>

      {/* ENHANCED POPUP WITH DENTAL/RETROFLEX SUPPORT */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            border: '3px solid #4e73df',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            zIndex: 99999,
            minWidth: '350px',
            maxWidth: '500px',
            maxHeight: '450px',
            overflow: 'hidden'
          }}
        >
          <div style={{
            background: '#4e73df',
            color: 'white',
            padding: '1rem 1.25rem',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🚀 Smart Odia Suggestions (Dental/Retroflex)</span>
            <small style={{ opacity: 0.9, fontSize: '0.8rem' }}>
              Tab/Enter to apply • Escape to cancel
            </small>
          </div>
          
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => applySuggestion(suggestion)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '1rem 1.25rem',
                  border: 'none',
                  background: suggestion.includes('Loading') ? '#f8f9fc' : 
                             index === 0 ? 'rgba(78, 115, 223, 0.1)' : 'white',
                  textAlign: 'left',
                  cursor: suggestion.includes('Loading') ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  fontSize: '1.3rem',
                  fontFamily: "'Noto Sans Oriya', serif",
                  minHeight: '65px',
                  color: suggestion.includes('Loading') ? '#666' : '#333'
                }}
                onMouseEnter={(e) => {
                  if (!suggestion.includes('Loading')) {
                    e.target.style.background = 'rgba(78, 115, 223, 0.15)';
                    e.target.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!suggestion.includes('Loading')) {
                    e.target.style.background = index === 0 ? 'rgba(78, 115, 223, 0.1)' : 'white';
                    e.target.style.transform = 'translateX(0)';
                  }
                }}
                disabled={suggestion.includes('Loading')}
              >
                <span>{suggestion}</span>
                {!suggestion.includes('Loading') && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {index === 0 && (
                      <span style={{
                        background: '#1cc88a',
                        color: 'white',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>Best</span>
                    )}
                    <span style={{
                      background: getSourceColor(suggestion, index),
                      color: 'white',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '3px',
                      fontSize: '0.65rem',
                      fontWeight: '500'
                    }}>
                      {getSourceLabel(suggestion, index)}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </Container>
  );
};

export default OcrTask;
