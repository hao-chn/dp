<template>
    <section>
        <el-col :span="24" class="section-item">
            <el-button size="mini" type="danger" @click="cancelDialog = true">取消交易</el-button>
            <el-button size="mini" type="primary" @click="purchaseDialog = true">购买数据</el-button>
            <el-button size="mini" type="primary" @click="decryptDialog = true">解密数据</el-button>
            <el-button size="mini" type="primary" @click="confirmPre">确认数据</el-button>
            <el-button size="mini" type="primary" @click="creditPre">评价验证者</el-button>
        </el-col>

        <el-table :data="this.$store.state.transactionbuy.slice((curPage-1)*pageSize, curPage*pageSize)"
                  highlight-current-row border :height=height @current-change="currentChange">
            <el-table-column type="expand">
                <el-form slot-scope="props" label-position="left" class="tx-table-expand">
                    <el-form-item label="标题"><span>{{ props.row.Title }}</span></el-form-item>
                    <el-form-item label="价格"><span>{{ props.row.Price }}</span></el-form-item>
                    <el-form-item label="标签"><span>{{ props.row.Keys }}</span></el-form-item>
                    <el-form-item label="描述"><span>{{ props.row.Description }}</span></el-form-item>
                    <el-form-item label="卖家"><span>{{ props.row.Seller }}</span></el-form-item>
                    <el-form-item label="状态"><span>{{ props.row.State }}</span></el-form-item>
                    <el-form-item label="验证者回复1"><span>{{ props.row.Verifier1Response }}</span></el-form-item>
                    <el-form-item label="验证者回复2"><span>{{ props.row.Verifier2Response }}</span></el-form-item>
                </el-form>
            </el-table-column>
            <el-table-column prop="Title" label="标题" show-overflow-tooltip></el-table-column>
            <el-table-column prop="Price" label="价格" show-overflow-tooltip></el-table-column>
            <el-table-column prop="State" label="状态" show-overflow-tooltip></el-table-column>
        </el-table>
        <el-pagination class="pagination" @current-change="setCurPage" @size-change="setPageSize" :total="total"
                       layout="sizes, total, prev, pager, next, jumper" :page-sizes="[5, 6]" :page-size="pageSize"
        ></el-pagination>

        <!-- dialogs -->
        <el-dialog :visible.sync="cancelDialog" title="输入密码：">
            <p>{{this.$store.state.account}}</p><el-input v-model="password" show-password clearable></el-input>
            <div slot="footer">
                <el-button @click="cancelClickFunc('cancel')">取消</el-button>
                <el-button type="primary" @click="cancelBuying">确认</el-button>
            </div>
        </el-dialog>
        <el-dialog :visible.sync="purchaseDialog" title="输入密码：">
            <p>{{this.$store.state.account}}</p><el-input v-model="password" show-password clearable></el-input>
            <div slot="footer">
                <el-button @click="cancelClickFunc('purchase')">取消</el-button>
                <el-button type="primary" @click="purchase">确认</el-button>
            </div>
        </el-dialog>
        <el-dialog :visible.sync="decryptDialog" title="输入密码：">
            <p>{{this.$store.state.account}}</p><el-input v-model="password" show-password clearable></el-input>
            <div slot="footer">
                <el-button @click="cancelClickFunc('decrypt')">取消</el-button>
                <el-button type="primary" @click="decrypt">确认</el-button>
            </div>
        </el-dialog>
        <el-dialog :visible.sync="confirmDialog" title="判断原始数据真实性：">
            <el-dialog :visible.sync="confirmDialog2" title="输入密码：" append-to-body>
                <p>{{this.$store.state.account}}</p><el-input v-model="password" show-password clearable></el-input>
                <div slot="footer">
                    <el-button @click="cancelClickFunc('confirm2')">取消</el-button>
                    <el-button type="primary" @click="confirm">确认</el-button>
                </div>
            </el-dialog>
            <div>
                <p v-if="supportVerify">判断原始数据真实性，如果你认为原始数据是假的，我们将为你启动仲裁流程：&nbsp;</p>
                <p v-if="!supportVerify">判断原始数据真实性，点击“输入密码”按钮完成交易。&nbsp;</p>
                <el-switch v-model="confirmData" active-text="真" inactive-text="假"></el-switch></div>
            <div slot="footer">
                <el-button @click="cancelClickFunc('confirm')">取消</el-button>
                <el-button type="primary" @click="confirmDialog2 = true">输入密码</el-button>
            </div>
        </el-dialog>
        <el-dialog :visible.sync="creditDialog" title="评价验证者：">
            <el-dialog :visible.sync="creditDialog2" title="输入密码：" append-to-body>
                <p>{{this.$store.state.account}}</p><el-input v-model="password" show-password clearable></el-input>
                <div slot="footer">
                    <el-button @click="cancelClickFunc('credit2')">取消</el-button>
                    <el-button type="primary" @click="credit">确认</el-button>
                </div>
            </el-dialog>
            <div>验证者1:
                <el-slider v-model="verifier1Credit" max="5" v-if="verifier1Revert" show-input></el-slider>
                <span v-if="!verifier1Revert">交易未进入验证流程或验证者未回复</span>
            </div>
            <div>验证者2:
                <el-slider v-model="verifier2Credit" max="5" v-if="verifier2Revert" show-input></el-slider>
                <span v-if="!verifier2Revert">交易未进入验证流程或验证者未回复</span>
            </div>
            <div slot="footer">
                <el-button @click="cancelClickFunc('credit')">取消</el-button>
                <el-button type="primary" @click="creditDialog2 = true">输入密码</el-button>
            </div>
        </el-dialog>
    </section>
</template>

<script>
import {utils} from "../../utils";
export default {
    name: "TransactionBuy",
    data () {
        return {
            selectedTx: {},  // {tID: "", User: "", MetaDataIDEncrypt: "", MetaDataExtension: "",
                             //  Verifier1Response: "", Verifier2Response: "", SupportVerify: false}
            curPage: 1,
            pageSize: 6,
            total: 0,
            password: "",
            height: window.innerHeight - 170,
            cancelDialog: false,
            purchaseDialog: false,
            decryptDialog: false,
            supportVerify: false,
            confirmDialog: false,
            confirmDialog2: false,
            confirmData: false,
            creditDialog: false,
            creditDialog2: false,
            verifier1Revert: false,
            verifier1Credit: 0,
            verifier2Revert: false,
            verifier2Credit: 0
        }
    },
    methods: {
        setCurPage: function (curPageReturn) {this.curPage = curPageReturn;},
        setPageSize: function (newPageSize) {this.pageSize = newPageSize;},
        currentChange: function (curRow) {
            this.selectedTx = {
                TransactionID: curRow.TransactionID,
                User: curRow.Buyer,
                MetaDataIDEncrypt: curRow.MetaDataIDEncWithBuyer,
                MetaDataExtension: curRow.MetaDataExtension,
                SupportVerify: curRow.SupportVerify,
                Verifier1Response: curRow.Verifier1Response,
                Verifier2Response: curRow.Verifier2Response
            };
        },
        cancelClickFunc: function (dialogName) {
            let str = "";
            switch (dialogName) {
                case "cancel": this.cancelDialog = false; str = "取消交易"; break;
                case "purchase": this.purchaseDialog = false; str = "购买数据"; break;
                case "decrypt": this.decryptDialog = false; str = "解密数据"; break;
                case "confirm": this.confirmDialog = false; str = "确认数据"; break;
                case "confirm2": this.confirmDialog2 = false; str = "确认数据"; break;
                case "credit": this.creditDialog = false; str = "评价验证者"; break;
                case "credit2": this.creditDialog2 = false; str = "评价验证者"; break;
            }
            this.$message({
                type: "info",
                message: "取消" + str
            });
        },
        cancelBuying: function () {
            this.cancelDialog = false;
            let pwd = this.password;
            this.password = "";
            utils.send({Name:"cancel", Payload:{password: pwd, tID: this.selectedTx}});
            utils.addCallbackFunc("cancel.callback", function (payload, _this) {
                console.log("取消交易成功");
            });
            utils.addCallbackFunc("cancel.callback.error", function (payload, _this) {
                console.log("取消交易失败：", payload);
                _this.$alert(payload, "取消交易失败！", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "error"
                });
            });
        },
        purchase: function () {
            this.purchaseDialog = false;
            let pwd = this.password;
            this.password = "";
            utils.send({Name:"purchase", Payload:{password: pwd, tID: this.selectedTx}});
            utils.addCallbackFunc("purchase.callback", function (payload, _this) {
                console.log("购买数据成功");
            });
            utils.addCallbackFunc("purchase.callback.error", function (payload, _this) {
                console.log("购买数据失败：", payload);
                _this.$alert(payload, "购买数据失败！", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "error"
                });
            });
        },
        decrypt: function () {
            this.decryptDialog = false;
            let pwd = this.password;
            this.password = "";
            utils.send({Name:"decrypt", Payload:{password: pwd, tID: this.selectedTx}});
            utils.addCallbackFunc("decrypt.callback", function (payload, _this) {
                console.log("解密数据成功", payload);
                _this.$alert(payload, "原始数据：", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "info"
                });
            });
            utils.addCallbackFunc("decrypt.callback.error", function (payload, _this) {
                console.log("解密数据失败：", payload);
                _this.$alert(payload, "解密数据失败！", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "error"
                });
            });
        },
        confirmPre: function () {
            if (this.selectedTx.SupportVerify) {
                this.supportVerify = true;
            }
            this.confirmDialog = true;
        },
        confirm: function () {
            this.confirmDialog2 = false;
            this.confirmDialog = false;
            let pwd = this.password;
            this.password = "";
            utils.send({Name:"confirm", Payload:{password: pwd, tID: this.selectedTx, confirmData: this.confirmData}});
            utils.addCallbackFunc("confirm.callback", function (payload, _this) {
                _this.supportVerify = false;
                console.log("确认数据成功", payload);
            });
            utils.addCallbackFunc("confirm.callback.error", function (payload, _this) {
                console.log("确认数据失败：", payload);
                _this.$alert(payload, "确认数据失败！", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "error"
                });
            });
        },
        creditPre: function () {
            if (this.selectedTx.Verifier1Response !== "") {
                this.verifier1Revert = true;
            }
            if (this.selectedTx.Verifier2Response !== "") {
                this.verifier2Revert = true;
            }
            this.creditDialog = true;
        },
        credit: function () {
            this.creditDialog2 = false;
            this.creditDialog = false;
            let pwd = this.password;
            this.password = "";
            utils.send({Name:"credit", Payload:{password: pwd, tID: this.selectedTx, credit: {
                        verifier1Revert: this.verifier1Revert, verifier1Credit: this.verifier1Credit,
                        verifier2Revert: this.verifier2Revert, verifier2Credit: this.verifier2Credit}}});
            utils.addCallbackFunc("credit.callback", function (payload, _this) {
                _this.verifier1Revert = false;
                _this.verifier2Revert = false;
                console.log("评价验证者成功");
            });
            utils.addCallbackFunc("credit.callback.error", function (payload, _this) {
                console.log("评价验证者失败：", payload);
                _this.$alert(payload, "评价验证者失败！", {
                    confirmButtonText: "关闭",
                    showClose: false,
                    type: "error"
                });
            });
        }
    },
    computed: {
        listenTxBRefresh() {
            return this.$store.state.transactionbuy;
        }
    },
    watch: {
        listenTxBRefresh: function () {
            this.curPage = 1;
            this.total = this.$store.state.transactionbuy.length;
        }
    },
    created () {
        this.total = this.$store.state.transactionbuy.length;
    }
}
</script>

<style>

</style>
