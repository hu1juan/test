import { Component, OnInit, ViewChild } from '@angular/core';
import { TestService } from '../_services/test.service';
import { SwalComponent } from '@toverux/ngx-sweetalert2';
import { FormControl, Validators } from '@angular/forms';
import { UrlSegment, Router, PRIMARY_OUTLET } from '@angular/router';
import swal from 'sweetalert2';

@Component({
  selector: 'app-onlinetest',
  templateUrl: './onlinetest.component.html',
  styleUrls: ['./onlinetest.component.scss']
})
export class OnlinetestComponent implements OnInit {
  @ViewChild('mySwal')
  private mySwal: SwalComponent;
  @ViewChild('submitSwal')
  private submitSwal: SwalComponent;
  email: string;
  questions: any;
  answerClass: string;
  myAnswers = [];
  currentQuestion = 1;
  counter = 0;
  isRefresh = 0;
  userId: number;
  userTestId: number;
  testTypeId: number;
  max: number;
  toggleEmailInput = true;
  isSubmit = false;
  isStartTest = false;
  constructor(private _TestService: TestService, private _route: Router) {}

  go() {
    this.isStartTest = true;
    if (!this.email) {
      this.mySwal.title = 'ERROR!';
      this.mySwal.text = 'Please provide email address.';
      this.mySwal.type = 'error';
      this.mySwal.allowOutsideClick = false;
      return this.mySwal.show();
    }
    const email = new FormControl(this.email, [
      Validators.required,
      Validators.email
    ]);
    if (email.status === 'INVALID') {
      this.mySwal.title = 'ERROR!';
      this.mySwal.text = 'Please provide valid email address.';
      this.mySwal.type = 'error';
      this.mySwal.allowOutsideClick = false;
      return this.mySwal.show();
    }

    const tree = this._route.parseUrl(this._route.url);
    const g = tree.root.children[PRIMARY_OUTLET];
    const s = g.segments;
    const path = s[s.length - 1].path;
    const testType = [
      { id: 1, type: 'frontend' },
      { id: 2, type: 'backend' },
      { id: 3, type: 'database' },
      { id: 4, type: 'corevalues' },
      { id: 5, type: 'english' },
      { id: 6, type: 'php' },
      { id: 7, type: 'mobile' }
    ];
    const index = testType.findIndex(x => x.type === path);
    this.testTypeId = testType[index].id;
    const userData = {
      email: this.email,
      testId: this.testTypeId
    };
    this._TestService.getQuestions(userData).subscribe(
      res => {
        if (!res['hasName'] && res['isOutsider']) {
          swal
            .mixin({
              input: 'text',
              confirmButtonText: 'Next &rarr;',
              showCancelButton: false,
              progressSteps: ['1', '2'],
              allowOutsideClick: false,
              allowEscapeKey: false
            })
            .queue([
              {
                title: 'Please fill the ff.',
                text: 'Enter your firstname',
                inputPlaceholder: 'Firstname',
                inputValidator: value => {
                  return !value && 'Firstname is required!';
                }
              },
              {
                title: 'Please fill the ff',
                text: 'Enter your lastname',
                inputPlaceholder: 'Lastname',
                inputValidator: value => {
                  return !value && 'Lastname is required!';
                }
              }
            ])
            .then(result => {
              if (result.value) {
                const data = {
                  userId: this.userId,
                  firstName: result.value[0],
                  lastName: result.value[1]
                };
                this._TestService.addName(data).subscribe(
                  resp => {
                    const toast = swal.mixin({
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 3000
                    });

                    toast({
                      type: 'success',
                      title: 'Name is saved successfully.'
                    });
                  },
                  err => {
                    this.refresh();
                    const toast = swal.mixin({
                      toast: true,
                      position: 'top-end',
                      showConfirmButton: false,
                      timer: 3000
                    });

                    toast({
                      type: 'error',
                      title: 'Error found!'
                    });
                  }
                );
              }
            });
        }
        if (res['isTaken']) {
          this.mySwal.title = 'Greetings  !';
          this.mySwal.text = 'You already have taken the test.';
          this.mySwal.type = 'success';
          this.mySwal.allowOutsideClick = false;
          return this.mySwal.show();
        }
        this.toggleEmailInput = false;
        this.questions = res['question'];
        this.userId = res['userId'];
        this.max = this.questions.length;
      },
      error => {
        this.mySwal.title = 'ERROR!';
        this.mySwal.text = 'Please try again later.';
        this.mySwal.type = 'error';
        this.mySwal.allowOutsideClick = false;
        return this.mySwal.show();
      }
    );
  }
  next() {
    this.currentQuestion += 1;
    this.checkAnswer();
  }
  prev() {
    this.currentQuestion -= 1;
    this.checkAnswer();
  }
  selectedAnswer(answer) {
    const index = this.myAnswers.findIndex(
      x => x.questionId === this.questions[this.currentQuestion - 1].questionId
    );
    if (index === -1) {
      this.myAnswers.push({
        questionId: this.questions[this.currentQuestion - 1].questionId,
        choiceId: answer.choiceId,
        answerStr: answer.choiceStr
      });
      this.counter++;
    } else {
      this.myAnswers[index].answerStr = answer.choiceStr;
      this.myAnswers[index].choiceId = answer.choiceId;
    }
    this.answerClass = answer.choiceStr;
  }

  checkAnswer() {
    const index = this.myAnswers.findIndex(
      x => x.questionId === this.questions[this.currentQuestion - 1].questionId
    );
    this.answerClass = index === -1 ? null : this.myAnswers[index].answerStr;
  }

  confirm() {
    if (this.counter !== this.max) {
      this.mySwal.title = 'REMINDER!';
      this.mySwal.text =
        'Please answer all the questions provided in the test.';
      this.mySwal.type = 'warning';
      this.mySwal.allowOutsideClick = false;
      return this.mySwal.show();
    }
    this.submitSwal.allowOutsideClick = false;
    return this.submitSwal.show();
  }

  submit() {
    this.isSubmit = true;
    const answer = {
      userId: this.userId,
      testId: this.testTypeId,
      answers: this.myAnswers
    };
    this._TestService.submitAnswer(answer).subscribe(
      res => {
        this.isRefresh = 1;
        this.mySwal.allowOutsideClick = false;
        this.mySwal.title = 'GOOD LUCK!';
        this.mySwal.text = 'Thank you for completing the test.';
        this.mySwal.type = 'success';
        this.mySwal.show();
        this.isSubmit = false;
      },
      error => {
        this.mySwal.title = 'ERROR!';
        this.mySwal.text = 'Something went wrong. Please try again later.';
        this.mySwal.type = 'error';
        return this.mySwal.show();
      }
    );
  }

  refresh() {
    location.reload();
  }

  startTest() {
    this.isStartTest = false;
  }
  ngOnInit() {}
}
