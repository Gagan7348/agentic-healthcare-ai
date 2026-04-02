"""
Report Analyzer for Agentic_Healthcare_AI Project
Reads lab report PDFs and text files (clinical notes, radiology, discharge summaries)
Works with your existing generated data in dataset/data/
"""

import PyPDF2
import re
import json
from pathlib import Path
from typing import Dict, List, Optional

class ReportAnalyzer:
    """
    Analyzes medical reports from your dataset/data/ folder
    Supports: PDFs (lab reports) and TXT files (clinical notes, radiology, discharge)
    """
    
    def __init__(self, data_dir='dataset/data'):
        self.data_dir = Path(data_dir)
        self.lab_reports_dir = self.data_dir / 'lab_reports'
        self.clinical_notes_dir = self.data_dir / 'clinical_notes'
        self.radiology_dir = self.data_dir / 'radiology_reports'
        self.discharge_dir = self.data_dir / 'discharge_summaries'
        
        # Medical terms database
        self.medical_terms = {
            'glucose': {
                'name': 'Blood Glucose',
                'explanation': 'Blood sugar level - how much sugar is in your blood',
                'normal_range': '70-100 mg/dL (fasting)',
                'unit': 'mg/dL'
            },
            'cholesterol': {
                'name': 'Total Cholesterol',
                'explanation': 'Total amount of fat/cholesterol in blood',
                'normal_range': 'Below 200 mg/dL',
                'unit': 'mg/dL'
            },
            'blood pressure': {
                'name': 'Blood Pressure',
                'explanation': 'Force of blood against artery walls',
                'normal_range': 'Below 120/80 mmHg',
                'unit': 'mmHg'
            },
            'creatinine': {
                'name': 'Creatinine',
                'explanation': 'Waste product filtered by kidneys - shows kidney health',
                'normal_range': '0.7-1.3 mg/dL',
                'unit': 'mg/dL'
            },
            'hemoglobin': {
                'name': 'Hemoglobin',
                'explanation': 'Protein that carries oxygen in blood',
                'normal_range': '12-17 g/dL',
                'unit': 'g/dL'
            }
        }
    
    def read_lab_report_pdf(self, patient_id: str) -> Dict:
        """
        Read lab report PDF from dataset/data/lab_reports/
        
        Args:
            patient_id: Patient ID (e.g., 'P000000')
            
        Returns:
            Dict with extracted values and explanations
        """
        pdf_path = self.lab_reports_dir / f'{patient_id}_lab_report.pdf'
        
        if not pdf_path.exists():
            return {'success': False, 'error': f'Lab report not found: {pdf_path}'}
        
        try:
            # Extract text from PDF
            text = self._extract_pdf_text(str(pdf_path))
            
            # Extract lab values
            extracted_values = self._extract_lab_values(text)
            
            # Explain terms
            explanations = self._explain_extracted_values(extracted_values)
            
            return {
                'success': True,
                'patient_id': patient_id,
                'source': str(pdf_path),
                'extracted_values': extracted_values,
                'explanations': explanations,
                'raw_text': text
            }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def read_clinical_note(self, patient_id: str) -> Dict:
        """Read clinical note txt file"""
        txt_path = self.clinical_notes_dir / f'{patient_id}_note.txt'
        
        if not txt_path.exists():
            return {'success': False, 'error': f'Clinical note not found: {txt_path}'}
        
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            # Extract key information
            info = self._parse_clinical_note(text)
            
            return {
                'success': True,
                'patient_id': patient_id,
                'source': str(txt_path),
                'type': 'clinical_note',
                'content': info,
                'raw_text': text
            }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def read_radiology_report(self, patient_id: str) -> Dict:
        """Read radiology report txt file"""
        txt_path = self.radiology_dir / f'{patient_id}_radiology.txt'
        
        if not txt_path.exists():
            return {'success': False, 'error': f'Radiology report not found: {txt_path}'}
        
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            # Extract findings
            findings = self._parse_radiology_report(text)
            
            return {
                'success': True,
                'patient_id': patient_id,
                'source': str(txt_path),
                'type': 'radiology',
                'findings': findings,
                'raw_text': text
            }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def read_discharge_summary(self, patient_id: str) -> Dict:
        """Read discharge summary txt file"""
        txt_path = self.discharge_dir / f'{patient_id}_discharge.txt'
        
        if not txt_path.exists():
            return {'success': False, 'error': f'Discharge summary not found: {txt_path}'}
        
        try:
            with open(txt_path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            # Extract discharge information
            info = self._parse_discharge_summary(text)
            
            return {
                'success': True,
                'patient_id': patient_id,
                'source': str(txt_path),
                'type': 'discharge_summary',
                'content': info,
                'raw_text': text
            }
        
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _extract_pdf_text(self, pdf_path: str) -> str:
        """Extract all text from PDF"""
        text = ""
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_lab_values(self, text: str) -> Dict[str, float]:
        """Extract lab values from text using regex patterns"""
        values = {}
        
        # Common lab value patterns
        patterns = {
            'glucose': [
                r'(?:glucose|GLU)[:\s]+(\d+\.?\d*)',
                r'blood\s+sugar[:\s]+(\d+\.?\d*)'
            ],
            'cholesterol': [
                r'cholesterol[:\s]+(\d+\.?\d*)',
                r'CHOL[:\s]+(\d+\.?\d*)'
            ],
            'blood_pressure': [
                r'BP[:\s]+(\d+)/\d+',
                r'blood\s+pressure[:\s]+(\d+)/\d+'
            ],
            'creatinine': [
                r'creatinine[:\s]+(\d+\.?\d*)',
                r'CREAT[:\s]+(\d+\.?\d*)'
            ],
            'hemoglobin': [
                r'hemoglobin[:\s]+(\d+\.?\d*)',
                r'HGB[:\s]+(\d+\.?\d*)'
            ]
        }
        
        for test_name, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    try:
                        values[test_name] = float(match.group(1))
                        break
                    except:
                        continue
        
        return values
    
    def _explain_extracted_values(self, values: Dict[str, float]) -> List[Dict]:
        """Explain extracted lab values in simple English"""
        explanations = []
        
        for test_name, value in values.items():
            # Clean test name for lookup
            clean_name = test_name.replace('_', ' ')
            
            term_info = self.medical_terms.get(clean_name)
            
            if term_info:
                # Interpret if normal/high/low
                interpretation = self._interpret_value(clean_name, value, term_info['normal_range'])
                
                explanations.append({
                    'test': term_info['name'],
                    'value': value,
                    'unit': term_info['unit'],
                    'explanation': term_info['explanation'],
                    'normal_range': term_info['normal_range'],
                    'status': interpretation['status'],
                    'message': interpretation['message']
                })
        
        return explanations
    
    def _interpret_value(self, test_name: str, value: float, normal_range: str) -> Dict:
        """Interpret if value is normal, high, or low"""
        try:
            if 'below' in normal_range.lower():
                threshold = float(re.search(r'(\d+\.?\d*)', normal_range).group(1))
                if value <= threshold:
                    return {'status': 'Normal', 'message': '✓ Within normal range'}
                else:
                    return {'status': 'High', 'message': f'⚠️ High - should be below {threshold}'}
            
            elif '/' in normal_range:  # Blood pressure
                numbers = re.findall(r'(\d+)', normal_range)
                if numbers and value <= int(numbers[0]):
                    return {'status': 'Normal', 'message': '✓ Within normal range'}
                else:
                    return {'status': 'High', 'message': f'⚠️ High - should be below {numbers[0] if numbers else "normal"}'}
            
            elif '-' in normal_range:  # Range
                numbers = re.findall(r'(\d+\.?\d*)', normal_range)
                if len(numbers) >= 2:
                    low = float(numbers[0])
                    high = float(numbers[1])
                    
                    if low <= value <= high:
                        return {'status': 'Normal', 'message': '✓ Within normal range'}
                    elif value < low:
                        return {'status': 'Low', 'message': f'⚠️ Low - normal is {low}-{high}'}
                    else:
                        return {'status': 'High', 'message': f'⚠️ High - normal is {low}-{high}'}
        except:
            pass
        
        return {'status': 'Unknown', 'message': 'Consult doctor for interpretation'}
    
    def _parse_clinical_note(self, text: str) -> Dict:
        """Parse clinical note text"""
        info = {}
        
        # Extract chief complaint
        cc_match = re.search(r'CHIEF COMPLAINT[:\s]+(.*?)(?:\n|$)', text, re.IGNORECASE)
        if cc_match:
            info['chief_complaint'] = cc_match.group(1).strip()
        
        # Extract assessment
        assessment_match = re.search(r'ASSESSMENT[:\s]+(.*?)(?:PLAN|$)', text, re.IGNORECASE | re.DOTALL)
        if assessment_match:
            info['assessment'] = assessment_match.group(1).strip()
        
        # Extract plan
        plan_match = re.search(r'PLAN[:\s]+(.*?)$', text, re.IGNORECASE | re.DOTALL)
        if plan_match:
            info['plan'] = plan_match.group(1).strip()
        
        return info
    
    def _parse_radiology_report(self, text: str) -> Dict:
        """Parse radiology report text"""
        findings = {}
        
        # Extract findings
        findings_match = re.search(r'FINDINGS[:\s]+(.*?)(?:IMPRESSION|$)', text, re.IGNORECASE | re.DOTALL)
        if findings_match:
            findings['findings'] = findings_match.group(1).strip()
        
        # Extract impression
        impression_match = re.search(r'IMPRESSION[:\s]+(.*?)$', text, re.IGNORECASE | re.DOTALL)
        if impression_match:
            findings['impression'] = impression_match.group(1).strip()
        
        return findings
    
    def _parse_discharge_summary(self, text: str) -> Dict:
        """Parse discharge summary text"""
        info = {}
        
        # Extract diagnosis
        diag_match = re.search(r'DIAGNOSIS[:\s]+(.*?)(?:\n|$)', text, re.IGNORECASE)
        if diag_match:
            info['diagnosis'] = diag_match.group(1).strip()
        
        # Extract discharge instructions
        inst_match = re.search(r'INSTRUCTIONS[:\s]+(.*?)$', text, re.IGNORECASE | re.DOTALL)
        if inst_match:
            info['instructions'] = inst_match.group(1).strip()
        
        return info
    
    def list_available_reports(self, patient_id: str) -> Dict:
        """List all available reports for a patient"""
        available = {}
        
        # Check lab report
        if (self.lab_reports_dir / f'{patient_id}_lab_report.pdf').exists():
            available['lab_report'] = True
        
        # Check clinical note
        if (self.clinical_notes_dir / f'{patient_id}_note.txt').exists():
            available['clinical_note'] = True
        
        # Check radiology
        if (self.radiology_dir / f'{patient_id}_radiology.txt').exists():
            available['radiology'] = True
        
        # Check discharge
        if (self.discharge_dir / f'{patient_id}_discharge.txt').exists():
            available['discharge_summary'] = True
        
        return available


# Quick test function
if __name__ == "__main__":
    analyzer = ReportAnalyzer()
    
    # Test with first patient
    patient_id = 'P000000'
    
    print(f"Testing with patient: {patient_id}")
    print("="*70)
    
    # Check available reports
    available = analyzer.list_available_reports(patient_id)
    print(f"\nAvailable reports: {available}")
    
    # Try reading lab report
    if available.get('lab_report'):
        result = analyzer.read_lab_report_pdf(patient_id)
        if result['success']:
            print(f"\n✅ Lab Report:")
            print(f"  Extracted values: {result['extracted_values']}")
            print(f"\n  Explanations:")
            for exp in result['explanations']:
                print(f"    • {exp['test']}: {exp['value']} {exp['unit']} - {exp['status']}")