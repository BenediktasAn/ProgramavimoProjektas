import json
import requests
from pathlib import Path

API_URL = "http://localhost:8000/api/chat"
TEST_FILE = Path(__file__).resolve().parent / "test_questions.json"


def run_tests():
    with open(TEST_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    passed = 0
    failed = 0
    results = []

    for i, test in enumerate(questions, 1):
        question = test["question"]
        expected_source = test["expected_source"]
        expected_keywords = test["expected_keywords"]

        print(f"\nTest {i}/{len(questions)}: {question}")

        try:
            response = requests.post(API_URL, json={
                "message": question,
                "conversation_history": []
            }, timeout=30)

            if response.status_code != 200:
                print(f"  FAIL - Server returned {response.status_code}")
                failed += 1
                results.append({"question": question, "status": "FAIL", "reason": f"HTTP {response.status_code}"})
                continue

            answer = response.json()["response"]
            print(f"  Answer: {answer[:150]}...")

            # Check keywords
            answer_lower = answer.lower()
            found_keywords = [kw for kw in expected_keywords if kw.lower() in answer_lower]
            missing_keywords = [kw for kw in expected_keywords if kw.lower() not in answer_lower]

            # Check if "not found" questions were correctly refused
            if expected_source == "not found":
                if any(kw.lower() in answer_lower for kw in ["don't have information", "neturiu informacijos", "contact", "susisiekite"]):
                    print(f"  PASS - Correctly refused")
                    passed += 1
                    results.append({"question": question, "status": "PASS"})
                else:
                    print(f"  FAIL - Should have refused but answered")
                    failed += 1
                    results.append({"question": question, "status": "FAIL", "reason": "Did not refuse"})
            elif len(found_keywords) >= len(expected_keywords) / 2:
                print(f"  PASS - Keywords found: {found_keywords}")
                if missing_keywords:
                    print(f"  Note - Missing: {missing_keywords}")
                passed += 1
                results.append({"question": question, "status": "PASS", "found": found_keywords})
            else:
                print(f"  FAIL - Missing keywords: {missing_keywords}")
                failed += 1
                results.append({"question": question, "status": "FAIL", "missing": missing_keywords})

        except requests.exceptions.ConnectionError:
            print(f"  FAIL - Cannot connect. Is the server running?")
            failed += 1
            results.append({"question": question, "status": "FAIL", "reason": "Connection error"})
            break
        except Exception as e:
            print(f"  FAIL - Error: {e}")
            failed += 1
            results.append({"question": question, "status": "FAIL", "reason": str(e)})

    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed out of {len(questions)}")
    print(f"Accuracy: {passed/len(questions)*100:.1f}%")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_tests()
    